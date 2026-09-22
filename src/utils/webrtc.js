// Public STUN servers so both browsers can discover their reachable
// network addresses. There's no TURN server here (that would need a
// paid/relay service), so this works great on most home wifi / mobile
// data, but two people both behind very strict corporate NATs might not
// be able to connect directly. Good enough for two people calling each
// other casually.
export const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const CALL_PATH_SEGMENT = "call";
export const CALL_DOC_ID = "current";
