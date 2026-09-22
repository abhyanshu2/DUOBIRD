import { useCallback, useRef, useState } from "react";

const MAX_DURATION_SEC = 180; // 3 minutes — plenty for a voice note, keeps the
// resulting file small enough to store as base64 in a Firestore doc.
const BITRATE = 24000; // 24kbps — good enough for voice, keeps files tiny

function pickMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
  ];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || "";
}

/**
 * Records a short voice note entirely in the browser. `stop()` resolves
 * with `{ blob, durationSec }` (or null if nothing was recorded), which
 * the caller turns into a base64 data URL and stores directly on the
 * message — no external storage service needed for something this small.
 */
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const stopResolveRef = useRef(null);
  const pendingResultRef = useRef(null);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const start = useCallback(async () => {
    setError(null);
    pendingResultRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: BITRATE,
      });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      // Always attached (not just when the consumer calls stop()), so a
      // hit against MAX_DURATION_SEC still cleans up properly even if
      // nobody has awaited stop() yet.
      recorder.onstop = () => {
        cleanupStream();
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const durationSec = (Date.now() - startedAtRef.current) / 1000;
        const result = blob.size > 0 ? { blob, durationSec } : null;
        chunksRef.current = [];

        if (stopResolveRef.current) {
          stopResolveRef.current(result);
          stopResolveRef.current = null;
        } else {
          pendingResultRef.current = result;
        }
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        const secs = (Date.now() - startedAtRef.current) / 1000;
        setElapsed(secs);
        if (secs >= MAX_DURATION_SEC) {
          mediaRecorderRef.current?.stop();
        }
      }, 200);
    } catch (err) {
      console.error("Failed to start recording:", err);
      cleanupStream();
      setError(err.message || "Couldn't access the microphone.");
    }
  }, []);

  /** Resolves with { blob, durationSec }, or null if nothing was recorded. */
  const stop = useCallback(() => {
    return new Promise((resolve) => {
      if (pendingResultRef.current !== null) {
        const result = pendingResultRef.current;
        pendingResultRef.current = null;
        resolve(result);
        return;
      }
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      stopResolveRef.current = resolve;
      recorder.stop();
    });
  }, []);

  const cancel = useCallback(() => {
    stopResolveRef.current = null;
    pendingResultRef.current = null;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanupStream();
    chunksRef.current = [];
    setRecording(false);
    setElapsed(0);
  }, []);

  return { recording, elapsed, error, start, stop, cancel, maxDuration: MAX_DURATION_SEC };
}

/** Converts a recorded Blob into a base64 data URL for storing on the message doc. */
export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Couldn't process that recording."));
    reader.readAsDataURL(blob);
  });
}
