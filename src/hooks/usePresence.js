import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const HEARTBEAT_MS = 20_000;
const ONLINE_THRESHOLD_MS = 30_000;

function presenceDoc(roomId, userId) {
  return doc(db, `threads/${roomId}/presence`, userId);
}

/**
 * Announces "I'm here" every few seconds for `myId`, and watches
 * `theirId`'s last-seen timestamp to decide if they currently count
 * as online. Scoped to `roomId` — this is intentionally simple, good
 * enough for a two-person room, not a distributed presence system.
 */
export function usePresence(roomId, myId, theirId) {
  const [theirOnline, setTheirOnline] = useState(false);
  const [theirLastSeen, setTheirLastSeen] = useState(null);

  useEffect(() => {
    if (!roomId || !myId) return undefined;

    const beat = () => setDoc(presenceDoc(roomId, myId), { lastSeen: serverTimestamp() });
    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") beat();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [roomId, myId]);

  useEffect(() => {
    if (!roomId || !theirId) return undefined;

    const unsubscribe = onSnapshot(presenceDoc(roomId, theirId), (snap) => {
      const lastSeen = snap.data()?.lastSeen;
      if (!lastSeen) {
        setTheirOnline(false);
        setTheirLastSeen(null);
        return;
      }
      const lastSeenDate = lastSeen.toDate();
      setTheirLastSeen(lastSeenDate);
      const elapsed = Date.now() - lastSeenDate.getTime();
      setTheirOnline(elapsed < ONLINE_THRESHOLD_MS);
    });

    return () => unsubscribe();
  }, [roomId, theirId]);

  return { theirOnline, theirLastSeen };
}
