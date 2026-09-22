import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const pinDocRef = (roomId) => doc(db, `threads/${roomId}/pinned`, "current");

/**
 * A room has at most one pinned message at a time — simple enough for a
 * two-person chat, and pinning a new one just replaces the old pin.
 * Stores a denormalized snapshot (sender, preview text, type) rather
 * than just the message id, so the banner can render instantly without
 * an extra lookup, and still shows something sensible even if the
 * original message is later edited or deleted.
 */
export function usePinnedMessage(roomId) {
  const [pinned, setPinned] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setPinned(null);
      return undefined;
    }
    const unsubscribe = onSnapshot(pinDocRef(roomId), (snap) => {
      setPinned(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return () => unsubscribe();
  }, [roomId]);

  const pinMessage = useCallback(
    async (msg) => {
      if (!roomId) return;
      const preview =
        msg.type === "voice"
          ? "Voice message"
          : msg.deleted
          ? "Message deleted"
          : (msg.message || "").slice(0, 120);

      await setDoc(pinDocRef(roomId), {
        messageId: msg.id,
        sender: msg.sender,
        type: msg.type,
        preview,
        pinnedAt: serverTimestamp(),
      });
    },
    [roomId]
  );

  const unpinMessage = useCallback(async () => {
    if (!roomId) return;
    await deleteDoc(pinDocRef(roomId)).catch(() => {});
  }, [roomId]);

  return { pinned, pinMessage, unpinMessage };
}
