import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const settingsRef = (roomId) => doc(db, `threads/${roomId}/settings`, "chat");

/**
 * Room-wide chat settings, shared by both people (so when one turns
 * "disappearing messages" on, the other sees it turn on too).
 */
export function useChatSettings(roomId, myId) {
  const [disappearing, setDisappearingState] = useState(false);

  useEffect(() => {
    if (!roomId) return undefined;
    const unsubscribe = onSnapshot(
      settingsRef(roomId),
      (snap) => setDisappearingState(Boolean(snap.data()?.disappearing)),
      (err) => console.error("Chat settings subscription failed:", err)
    );
    return () => unsubscribe();
  }, [roomId]);

  const setDisappearing = useCallback(
    async (value) => {
      if (!roomId) return;
      await setDoc(
        settingsRef(roomId),
        {
          disappearing: Boolean(value),
          updatedBy: myId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [roomId, myId]
  );

  return { disappearing, setDisappearing };
}
