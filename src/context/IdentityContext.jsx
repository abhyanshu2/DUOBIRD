import { createContext, useContext, useEffect, useState } from "react";
import { USERS, IDENTITY_STORAGE_KEY, ROOM_STORAGE_KEY } from "../utils/constants";
import { slugifyRoomCode } from "../utils/room";
import { useProfileNames } from "../hooks/useProfileNames";

const IdentityContext = createContext(null);

export function IdentityProvider({ children }) {
  const [roomCode, setRoomCodeState] = useState(
    () => localStorage.getItem(ROOM_STORAGE_KEY) || null
  );
  const [identity, setIdentityState] = useState(() => {
    const stored = localStorage.getItem(IDENTITY_STORAGE_KEY);
    return stored && USERS[stored] ? stored : null;
  });

  // The room code is what a couple shares between themselves; the
  // slugified roomId is the actual Firestore path segment derived from
  // it. Two different-looking codes that slugify the same way (e.g.
  // "Hamara Pyaar" and "hamara-pyaar") land in the same room on
  // purpose — the slug is the real key, the code is just how it's typed.
  const roomId = roomCode ? slugifyRoomCode(roomCode) : null;

  const { names: customNames, updateName } = useProfileNames(roomId);

  useEffect(() => {
    if (roomCode) localStorage.setItem(ROOM_STORAGE_KEY, roomCode);
  }, [roomCode]);

  useEffect(() => {
    if (identity) localStorage.setItem(IDENTITY_STORAGE_KEY, identity);
  }, [identity]);

  const joinRoom = (code) => {
    const slug = slugifyRoomCode(code);
    if (!slug) return false;
    setRoomCodeState(code.trim());
    return true;
  };

  const leaveRoom = () => {
    localStorage.removeItem(ROOM_STORAGE_KEY);
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
    setRoomCodeState(null);
    setIdentityState(null);
  };

  const setIdentity = (id) => {
    if (USERS[id]) setIdentityState(id);
  };

  const clearIdentity = () => {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
    setIdentityState(null);
  };

  const displayName = (id) => (customNames[id] && customNames[id].trim()) || USERS[id].name;

  const me = identity ? { ...USERS[identity], name: displayName(identity) } : null;
  const otherId = identity === "A" ? "B" : identity === "B" ? "A" : null;
  const them = otherId ? { ...USERS[otherId], name: displayName(otherId) } : null;

  return (
    <IdentityContext.Provider
      value={{
        roomCode,
        roomId,
        identity,
        me,
        them,
        joinRoom,
        leaveRoom,
        setIdentity,
        clearIdentity,
        displayName,
        updateName,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within IdentityProvider");
  return ctx;
}
