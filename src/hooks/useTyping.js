import { useEffect, useRef, useState, useCallback } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

const STALE_MS = 5000; // if no update in 5s, treat "typing" as stopped
const IDLE_MS = 2000; // stop announcing "typing" after 2s of no keystrokes

const typingDoc = (roomId, userId) => doc(db, `threads/${roomId}/typing`, userId);

/**
 * Tracks and announces typing state for one room. Writes are throttled
 * to once per state flip (not per keystroke), and the other person's
 * indicator times out on its own if their tab closes without a clean
 * "stopped typing" write.
 */
export function useTyping(roomId, myId, theirId) {
  const [theirTyping, setTheirTyping] = useState(false);
  const isTypingRef = useRef(false);
  const idleTimer = useRef(null);

  useEffect(() => {
    if (!roomId || !theirId) return undefined;

    let staleTimer = null;
    const unsubscribe = onSnapshot(typingDoc(roomId, theirId), (snap) => {
      const data = snap.data();
      if (!data?.isTyping || !data?.updatedAt) {
        setTheirTyping(false);
        return;
      }
      const age = Date.now() - data.updatedAt.toDate().getTime();
      if (age > STALE_MS) {
        setTheirTyping(false);
        return;
      }
      setTheirTyping(true);
      clearTimeout(staleTimer);
      staleTimer = setTimeout(() => setTheirTyping(false), STALE_MS - age);
    });

    return () => {
      unsubscribe();
      clearTimeout(staleTimer);
    };
  }, [roomId, theirId]);

  const setTyping = useCallback(
    (typing) => {
      if (!roomId || !myId) return;
      clearTimeout(idleTimer.current);

      if (typing) {
        if (!isTypingRef.current) {
          isTypingRef.current = true;
          setDoc(typingDoc(roomId, myId), { isTyping: true, updatedAt: serverTimestamp() }).catch(
            () => {}
          );
        }
        idleTimer.current = setTimeout(() => {
          isTypingRef.current = false;
          setDoc(typingDoc(roomId, myId), { isTyping: false, updatedAt: serverTimestamp() }).catch(
            () => {}
          );
        }, IDLE_MS);
      } else if (isTypingRef.current) {
        isTypingRef.current = false;
        setDoc(typingDoc(roomId, myId), { isTyping: false, updatedAt: serverTimestamp() }).catch(
          () => {}
        );
      }
    },
    [roomId, myId]
  );

  useEffect(() => {
    return () => {
      clearTimeout(idleTimer.current);
      if (roomId && myId && isTypingRef.current) {
        setDoc(typingDoc(roomId, myId), { isTyping: false, updatedAt: serverTimestamp() }).catch(
          () => {}
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myId]);

  return { theirTyping, setTyping };
}
