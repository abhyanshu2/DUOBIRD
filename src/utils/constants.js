// This app can now host any number of private two-person rooms in the
// same deployment. There's no signup — whoever enters the right Room
// Code lands in that pair's private thread, then picks which of the
// two seats ("User 1" / "User 2") is them for this device.
export const USERS = {
  A: {
    id: "A",
    name: import.meta.env.VITE_USER_A_NAME || "User 1",
    avatar: import.meta.env.VITE_USER_A_AVATAR || "1",
  },
  B: {
    id: "B",
    name: import.meta.env.VITE_USER_B_NAME || "User 2",
    avatar: import.meta.env.VITE_USER_B_AVATAR || "2",
  },
};

// Optional extra app-wide gate (set VITE_ACCESS_CODE in .env) on top of
// the per-room code below. Most deployments won't need this — the Room
// Code already keeps rooms private — but it's there for an extra layer
// if this app is ever put somewhere more public.
export const ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE || "";

export const IDENTITY_STORAGE_KEY = "duo-chat-identity";
export const ROOM_STORAGE_KEY = "duo-chat-room";
export const ROOM_PIN_STORAGE_KEY = "duo-chat-room-pin";