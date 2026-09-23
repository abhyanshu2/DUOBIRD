import { createContext, useContext, useEffect, useState } from "react";
import {
  USERS,
  IDENTITY_STORAGE_KEY,
  ROOM_STORAGE_KEY,
  ROOM_PIN_STORAGE_KEY,
} from "../utils/constants";
import { buildRoomId } from "../utils/room";
import { useProfileNames } from "../hooks/useProfileNames";

const IdentityContext = createContext(null);

export function IdentityProvider({ children }) {
  const [roomCode, setRoomCodeState] = useState(
    () => localStorage.getItem(ROOM_STORAGE_KEY) || null
  );
  const [roomPin, setRoomPinState] = useState(
    () => localStorage.getItem(ROOM_PIN_STORAGE_KEY) || null
  );
  const [identity, setIdentityState] = useState(() => {
    const stored = localStorage.getItem(IDENTITY_STORAGE_KEY);
    return stored && USERS[stored] ? stored : null;
  });

  // The room's Firestore path is derived from BOTH the name and a
  // secret PIN the couple shares — not the name alone. Two different
  // couples could easily pick the same memorable name ("anshu"), but
  // they won't also share the same private PIN, so they never end up
  // in the same thread.
  const roomId = roomCode && roomPin ? buildRoomId(roomCode, roomPin) : null;

  const { names: customNames, updateName } = useProfileNames(roomId);

  useEffect(() => {
    if (roomCode) localStorage.setItem(ROOM_STORAGE_KEY, roomCode);
  }, [roomCode]);

  useEffect(() => {
    if (roomPin) localStorage.setItem(ROOM_PIN_STORAGE_KEY, roomPin);
  }, [roomPin]);

  useEffect(() => {
    if (identity) localStorage.setItem(IDENTITY_STORAGE_KEY, identity);
  }, [identity]);

  const joinRoom = (code, pin) => {
    const id = buildRoomId(code, pin);
    if (!id) return false;
    setRoomCodeState(code.trim());
    setRoomPinState(pin.trim());
    return true;
  };

  const leaveRoom = () => {
    localStorage.removeItem(ROOM_STORAGE_KEY);
    localStorage.removeItem(ROOM_PIN_STORAGE_KEY);
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
    setRoomCodeState(null);
    setRoomPinState(null);
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
        roomPin,
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