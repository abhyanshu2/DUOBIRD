import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limitToLast,
  getDocs,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { blobToDataUrl } from "./useVoiceRecorder";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TIMEOUT = 2 ** 31 - 1;

/** When a disappearing message expires (ms), or null if it never does. */
const expiryMs = (m) => m.expireAt?.toMillis?.() ?? null;

/** Turns a full message into the small snapshot a reply quotes. */
function buildReplyPreview(msg) {
  if (!msg) return null;
  return {
    id: msg.id,
    sender: msg.sender,
    type: msg.type,
    preview:
      msg.type === "voice"
        ? "Voice message"
        : msg.deleted
        ? "Message deleted"
        : (msg.message || "").slice(0, 120),
  };
}

/**
 * Subscribes to one room's message thread in real time and exposes
 * `send`, `sendVoice`, `editMessage`, `deleteMessage`, and `clearChat`.
 * When `disappearing` is on, every new message is stamped to vanish after
 * 24 hours: it is hidden the moment it expires and then deleted for good.
 * `roomId` scopes everything — two rooms never see each other's
 * messages even though they share the same Firebase project.
 */
export function useMessages(roomId, disappearing = false) {
  const [rawMessages, setRawMessages] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const purgedRef = useRef(new Set());
  const [status, setStatus] = useState("connecting"); // connecting | ready | error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) return undefined;

    const messagesPath = `threads/${roomId}/messages`;
    const q = query(
      collection(db, messagesPath),
      orderBy("createdAt", "asc"),
      limitToLast(500)
    );

    setStatus("connecting");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRawMessages(next);
        setStatus("ready");
      },
      (err) => {
        console.error("Message subscription failed:", err);
        setError(err.message || "Couldn't connect to the chat.");
        setStatus("error");
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  // Wake up exactly when the next disappearing message runs out.
  useEffect(() => {
    const upcoming = rawMessages
      .map(expiryMs)
      .filter((t) => t !== null && t > now);
    if (upcoming.length === 0) return undefined;
    const delay = Math.min(Math.min(...upcoming) - Date.now() + 300, MAX_TIMEOUT);
    const id = setTimeout(() => setNow(Date.now()), Math.max(delay, 300));
    return () => clearTimeout(id);
  }, [rawMessages, now]);

  // Timers pause while the phone sleeps — re-check when the app comes back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Expired messages disappear from the screen instantly...
  const messages = useMemo(
    () =>
      rawMessages.filter((m) => {
        const t = expiryMs(m);
        return t === null || t > now;
      }),
    [rawMessages, now]
  );

  // ...and are then deleted from the database for good.
  useEffect(() => {
    if (!roomId) return;
    const t = Date.now();
    const expired = rawMessages
      .filter((m) => {
        const e = expiryMs(m);
        return e !== null && e <= t && !purgedRef.current.has(m.id);
      })
      .slice(0, 450);
    if (expired.length === 0) return;

    expired.forEach((m) => purgedRef.current.add(m.id));
    const batch = writeBatch(db);
    expired.forEach((m) =>
      batch.delete(doc(db, `threads/${roomId}/messages`, m.id))
    );
    batch.commit().catch((err) => {
      console.error("Failed to remove expired messages:", err);
      expired.forEach((m) => purgedRef.current.delete(m.id));
    });
  }, [rawMessages, now, roomId]);

  const send = useCallback(
    async (text, senderId, replyToMsg) => {
      const trimmed = text.trim();
      if (!trimmed || !roomId) return;

      await addDoc(collection(db, `threads/${roomId}/messages`), {
        type: "text",
        sender: senderId,
        message: trimmed,
        createdAt: serverTimestamp(),
        replyTo: buildReplyPreview(replyToMsg),
        expireAt: disappearing ? Timestamp.fromMillis(Date.now() + DAY_MS) : null,
      });
    },
    [roomId, disappearing]
  );

  const sendVoice = useCallback(
    async (blob, senderId, durationSec, replyToMsg) => {
      if (!blob || !roomId) return;

      const audioUrl = await blobToDataUrl(blob);

      await addDoc(collection(db, `threads/${roomId}/messages`), {
        type: "voice",
        sender: senderId,
        message: "",
        audioUrl,
        durationSec: Math.max(1, Math.round(durationSec || 0)),
        createdAt: serverTimestamp(),
        replyTo: buildReplyPreview(replyToMsg),
        expireAt: disappearing ? Timestamp.fromMillis(Date.now() + DAY_MS) : null,
      });
    },
    [roomId, disappearing]
  );

  const editMessage = useCallback(
    async (messageId, newText) => {
      const trimmed = newText.trim();
      if (!trimmed || !roomId) return;

      await updateDoc(doc(db, `threads/${roomId}/messages`, messageId), {
        message: trimmed,
        edited: true,
        editedAt: serverTimestamp(),
      });
    },
    [roomId]
  );

  const deleteMessage = useCallback(
    async (messageId) => {
      if (!roomId) return;

      // Soft delete — keeps the document (so reply-quotes pointing at it
      // still resolve sensibly) but clears its content.
      await updateDoc(doc(db, `threads/${roomId}/messages`, messageId), {
        deleted: true,
        message: "",
        audioUrl: null,
      });
    },
    [roomId]
  );

  /**
   * Permanently deletes every message in this room's thread. There's no
   * undo — this really does wipe the whole conversation for both
   * people in this room (other rooms are untouched).
   */
  const clearChat = useCallback(async () => {
    if (!roomId) return;
    const messagesPath = `threads/${roomId}/messages`;
    const BATCH_LIMIT = 450; // stay comfortably under Firestore's 500 writes/batch

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const snapshot = await getDocs(collection(db, messagesPath));
      if (snapshot.empty) break;

      const chunk = snapshot.docs.slice(0, BATCH_LIMIT);
      const batch = writeBatch(db);
      chunk.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();

      if (snapshot.docs.length <= BATCH_LIMIT) break;
    }
  }, [roomId]);

  return {
    messages,
    status,
    error,
    send,
    sendVoice,
    editMessage,
    deleteMessage,
    clearChat,
  };
}