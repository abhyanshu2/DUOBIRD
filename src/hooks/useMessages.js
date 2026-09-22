import { useEffect, useState, useCallback } from "react";
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
} from "firebase/firestore";
import { db } from "../firebase/config";
import { blobToDataUrl } from "./useVoiceRecorder";

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
 * `roomId` scopes everything — two rooms never see each other's
 * messages even though they share the same Firebase project.
 */
export function useMessages(roomId) {
  const [messages, setMessages] = useState([]);
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
        setMessages(next);
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
      });
    },
    [roomId]
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
      });
    },
    [roomId]
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
