import { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/config";

const profileDocRef = (roomId, userId) => doc(db, `threads/${roomId}/profile`, userId);

/**
 * Lets either person rename themselves from the entry screen. The name
 * lives in Firestore (not just localStorage), scoped to this room, so
 * when one person renames themselves, their partner's browser sees the
 * new name too — not just their own. If nobody has ever renamed a
 * slot, this returns null for it and the caller falls back to the
 * default ("User 1" / "User 2").
 */
export function useProfileNames(roomId) {
  const [names, setNames] = useState({ A: null, B: null });

  useEffect(() => {
    if (!roomId) {
      setNames({ A: null, B: null });
      return undefined;
    }

    let unsubA = () => {};
    let unsubB = () => {};

    // Firestore rules require an authenticated request, and anonymous
    // sign-in happens once at app start — so wait for that before
    // subscribing, otherwise the first read would be denied.
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      unsubA = onSnapshot(profileDocRef(roomId, "A"), (snap) => {
        setNames((prev) => ({ ...prev, A: snap.exists() ? snap.data().name : null }));
      });
      unsubB = onSnapshot(profileDocRef(roomId, "B"), (snap) => {
        setNames((prev) => ({ ...prev, B: snap.exists() ? snap.data().name : null }));
      });
    });

    return () => {
      unsubAuth();
      unsubA();
      unsubB();
    };
  }, [roomId]);

  const updateName = useCallback(
    async (userId, name) => {
      if (!roomId) return;
      const trimmed = (name || "").trim().slice(0, 30);
      if (!trimmed) return;
      await setDoc(
        profileDocRef(roomId, userId),
        { name: trimmed, updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
    [roomId]
  );

  return { names, updateName };
}
