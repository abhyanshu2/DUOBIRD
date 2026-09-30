import { useCallback, useEffect, useRef, useState } from "react";
import {
  doc,
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { ICE_SERVERS, CALL_DOC_ID } from "../utils/webrtc";

const callDocRef = (roomId) =>
  doc(db, `threads/${roomId}/call`, CALL_DOC_ID);
const callerCandidatesRef = (roomId) =>
  collection(db, `threads/${roomId}/call/${CALL_DOC_ID}/callerCandidates`);
const calleeCandidatesRef = (roomId) =>
  collection(db, `threads/${roomId}/call/${CALL_DOC_ID}/calleeCandidates`);

const initialState = {
  status: "idle", // idle | outgoing | incoming | active | ended | declined | failed
  role: null, // "caller" | "callee"
  mode: "audio", // "audio" | "video"
  otherName: null,
  otherAvatar: null,
  error: null,
  muted: false,
  cameraOff: false,
  facing: "user", // "user" = front camera, "environment" = back camera
  duration: 0,
};

/**
 * Two-person audio/video calling over plain WebRTC, using a single
 * Firestore document (+ two tiny ICE-candidate subcollections) as the
 * signaling channel instead of a custom backend. No media ever touches
 * Firestore — only the SDP offer/answer text and ICE candidates do; the
 * actual audio/video flows peer-to-peer once connected.
 */
export function useCall(roomId, myId, theirId, theirName, theirAvatar) {
  const [state, setState] = useState(initialState);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const unsubCallerCandidates = useRef(null);
  const unsubCalleeCandidates = useRef(null);
  const remoteDescSet = useRef(false);
  const pendingRemoteCandidates = useRef([]);
  const durationTimer = useRef(null);
  const hasHandledOfferRef = useRef(false);
  const facingRef = useRef("user");
  const switchingRef = useRef(false);

  const patch = (partial) => setState((prev) => ({ ...prev, ...partial }));

  const stopDurationTimer = () => {
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
  };

  const startDurationTimer = () => {
    stopDurationTimer();
    const startedAt = Date.now();
    durationTimer.current = setInterval(() => {
      patch({ duration: Math.floor((Date.now() - startedAt) / 1000) });
    }, 1000);
  };

  const teardownConnection = useCallback(() => {
    stopDurationTimer();
    if (unsubCallerCandidates.current) unsubCallerCandidates.current();
    if (unsubCalleeCandidates.current) unsubCalleeCandidates.current();
    unsubCallerCandidates.current = null;
    unsubCalleeCandidates.current = null;

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    remoteStreamRef.current = null;
    setRemoteStream(null);
    remoteDescSet.current = false;
    pendingRemoteCandidates.current = [];
    hasHandledOfferRef.current = false;
  }, []);

  const cleanupFirestore = useCallback(async () => {
    try {
      const [callerSnap, calleeSnap] = await Promise.all([
        getDocs(callerCandidatesRef(roomId)),
        getDocs(calleeCandidatesRef(roomId)),
      ]);
      await Promise.all([
        ...callerSnap.docs.map((d) => deleteDoc(d.ref)),
        ...calleeSnap.docs.map((d) => deleteDoc(d.ref)),
      ]);
      await deleteDoc(callDocRef(roomId));
    } catch {
      // Best-effort cleanup — nothing user-facing depends on this succeeding.
    }
  }, [roomId]);

  const createPeerConnection = useCallback((onIceCandidate) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (event) => {
      if (event.candidate) onIceCandidate(event.candidate.toJSON());
    };
    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      setRemoteStream(event.streams[0]);
    };
    return pc;
  }, []);

  const attachLocalMedia = async (pc, mode) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === "video" ? { facingMode: "user", width: { ideal: 640 } } : false,
    });
    facingRef.current = "user";
    localStreamRef.current = stream;
    setLocalStream(stream);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  };

  const flushPendingCandidates = async (pc) => {
    const queued = pendingRemoteCandidates.current;
    pendingRemoteCandidates.current = [];
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch {
        // Ignore malformed/late candidates.
      }
    }
  };

  const addRemoteCandidate = async (candidateJson) => {
    const pc = pcRef.current;
    if (!pc) return;
    if (!remoteDescSet.current) {
      pendingRemoteCandidates.current.push(candidateJson);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidateJson));
    } catch {
      // Ignore malformed/late candidates.
    }
  };

  const endCall = useCallback(
    async (finalStatus = "ended") => {
      teardownConnection();
      try {
        await updateDoc(callDocRef(roomId), {
          status: finalStatus,
          endedAt: serverTimestamp(),
        });
      } catch {
        // Doc may already be gone — fine either way.
      }
      setTimeout(cleanupFirestore, 1200);
      patch({ ...initialState });
    },
    [roomId, teardownConnection, cleanupFirestore]
  );

  const startCall = useCallback(
    async (mode = "audio") => {
      if (!roomId || !myId || !theirId) return;
      patch({
        status: "outgoing",
        role: "caller",
        mode,
        otherName: theirName,
        otherAvatar: theirAvatar,
        error: null,
        duration: 0,
        cameraOff: false,
        facing: "user",
      });

      try {
        const pc = createPeerConnection(async (candidateJson) => {
          try {
            await addDoc(callerCandidatesRef(roomId), candidateJson);
          } catch {
            // Non-fatal — worst case the call has slightly worse connectivity.
          }
        });
        pcRef.current = pc;

        await attachLocalMedia(pc, mode);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await setDoc(callDocRef(roomId), {
          status: "ringing",
          mode,
          caller: myId,
          callee: theirId,
          offer: { type: offer.type, sdp: offer.sdp },
          answer: null,
          createdAt: serverTimestamp(),
        });

        // Listen for the callee's ICE candidates as they trickle in.
        unsubCalleeCandidates.current = onSnapshot(calleeCandidatesRef(roomId), (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") addRemoteCandidate(change.doc.data());
          });
        });
      } catch (err) {
        console.error("Failed to start call:", err);
        teardownConnection();
        patch({
          status: "idle",
          error: err.message || "Couldn't access the camera/microphone.",
        });
      }
    },
    [roomId, myId, theirId, theirName, theirAvatar, createPeerConnection, teardownConnection]
  );

  const acceptCall = useCallback(
    async (offer, mode) => {
      try {
        patch({ status: "active", role: "callee", mode, error: null, duration: 0, cameraOff: false, facing: "user" });

        const pc = createPeerConnection(async (candidateJson) => {
          try {
            await addDoc(calleeCandidatesRef(roomId), candidateJson);
          } catch {
            // Non-fatal.
          }
        });
        pcRef.current = pc;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSet.current = true;
        await flushPendingCandidates(pc);

        await attachLocalMedia(pc, mode);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await updateDoc(callDocRef(roomId), {
          status: "active",
          answer: { type: answer.type, sdp: answer.sdp },
        });

        unsubCallerCandidates.current = onSnapshot(callerCandidatesRef(roomId), (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === "added") addRemoteCandidate(change.doc.data());
          });
        });

        startDurationTimer();
      } catch (err) {
        console.error("Failed to accept call:", err);
        teardownConnection();
        patch({ status: "idle", error: err.message || "Couldn't join the call." });
      }
    },
    [roomId, createPeerConnection, teardownConnection]
  );

  const declineCall = useCallback(async () => {
    teardownConnection();
    try {
      await updateDoc(callDocRef(roomId), { status: "declined" });
    } catch {
      // Fine — doc may already be cleaned up.
    }
    setTimeout(cleanupFirestore, 1200);
    patch({ ...initialState });
  }, [roomId, teardownConnection, cleanupFirestore]);

  const hangUp = useCallback(() => endCall("ended"), [endCall]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextMuted = !state.muted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !nextMuted));
    patch({ muted: nextMuted });
  }, [state.muted]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    const nextOff = !state.cameraOff;
    videoTracks.forEach((t) => (t.enabled = !nextOff));
    patch({ cameraOff: nextOff });
  }, [state.cameraOff]);

  // Flip between the front and back camera without dropping the call:
  // grab a new video track and swap it into the existing connection.
  const switchCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    const pc = pcRef.current;
    if (!stream || !pc || switchingRef.current) return;
    const oldTrack = stream.getVideoTracks()[0];
    if (!oldTrack) return;

    switchingRef.current = true;
    const previousFacing = facingRef.current;
    const nextFacing = previousFacing === "user" ? "environment" : "user";
    const oldDeviceId = oldTrack.getSettings?.().deviceId;
    const wasOff = !oldTrack.enabled;

    const getVideoTrack = async (facing) => {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: facing }, width: { ideal: 640 } },
      });
      return s.getVideoTracks()[0];
    };

    try {
      // Many phones can't open a second camera while the first is running.
      oldTrack.stop();

      let newTrack;
      let wanted = nextFacing;
      try {
        newTrack = await getVideoTrack(nextFacing);
      } catch {
        // Couldn't open the other camera — reopen the one we had.
        wanted = previousFacing;
        newTrack = await getVideoTrack(previousFacing);
      }
      newTrack.enabled = !wasOff;

      const settings = newTrack.getSettings?.() || {};
      let facing = wanted;
      if (settings.facingMode) facing = settings.facingMode;
      else if (oldDeviceId && settings.deviceId === oldDeviceId) facing = previousFacing;
      facingRef.current = facing;

      const sender = pc.getSenders().find((snd) => snd.track && snd.track.kind === "video");
      if (sender) await sender.replaceTrack(newTrack);

      stream.removeTrack(oldTrack);
      stream.addTrack(newTrack);
      const nextStream = new MediaStream(stream.getTracks());
      localStreamRef.current = nextStream;
      setLocalStream(nextStream);
      patch({ facing });
    } catch (err) {
      console.error("Failed to switch camera:", err);
    } finally {
      switchingRef.current = false;
    }
  }, []);

  // Main signaling listener: watches the single call document for this
  // thread and reacts based on whether we're the caller or callee.
  useEffect(() => {
    if (!roomId || !myId || !theirId) return undefined;

    const unsubscribe = onSnapshot(callDocRef(roomId), async (snap) => {
      if (!snap.exists()) {
        // Doc removed — if we thought we were mid-call, wind down quietly.
        setState((prev) => {
          if (prev.status === "idle") return prev;
          return { ...initialState };
        });
        return;
      }

      const data = snap.data();

      if (data.status === "ringing" && data.callee === myId) {
        setState((prev) => {
          if (prev.status !== "idle") return prev; // already busy
          hasHandledOfferRef.current = false;
          return {
            ...initialState,
            status: "incoming",
            role: "callee",
            mode: data.mode || "audio",
            otherName: theirName,
            otherAvatar: theirAvatar,
            incomingOffer: data.offer,
          };
        });
        return;
      }

      if (data.status === "active" && data.answer && myId === data.caller) {
        const pc = pcRef.current;
        if (pc && !remoteDescSet.current) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            remoteDescSet.current = true;
            await flushPendingCandidates(pc);
            startDurationTimer();
            patch({ status: "active" });
          } catch (err) {
            console.error("Failed to apply answer:", err);
          }
        }
        return;
      }

      if (data.status === "declined") {
        setState((prev) => {
          if (prev.status === "idle") return prev;
          teardownConnection();
          return { ...initialState, status: "declined" };
        });
        setTimeout(() => patch({ status: "idle" }), 1600);
        return;
      }

      if (data.status === "ended") {
        setState((prev) => {
          if (prev.status === "idle") return prev;
          teardownConnection();
          return { ...initialState, status: "ended" };
        });
        setTimeout(() => patch({ status: "idle" }), 1200);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myId, theirId, theirName, theirAvatar]);

  useEffect(() => () => teardownConnection(), [teardownConnection]);

  return {
    ...state,
    remoteStream,
    localStream,
    startCall,
    acceptCall: () => acceptCall(state.incomingOffer, state.mode),
    declineCall,
    hangUp,
    toggleMute,
    toggleCamera,
    switchCamera,
  };
}