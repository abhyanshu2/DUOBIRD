import { useEffect, useRef } from "react";
import {
  HiPhone,
  HiPhoneXMark,
  HiMicrophone,
  HiSpeakerXMark,
  HiVideoCamera,
  HiVideoCameraSlash,
} from "react-icons/hi2";
import CallChat from "./CallChat";

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallOverlay({ call, chat }) {
  const audioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  const isVideo = call.mode === "video";

  useEffect(() => {
    if (isVideo && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = call.remoteStream || null;
    } else if (audioRef.current) {
      audioRef.current.srcObject = call.remoteStream || null;
    }
  }, [call.remoteStream, isVideo]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = call.localStream || null;
    }
  }, [call.localStream]);

  if (call.status === "idle") return null;

  const isIncoming = call.status === "incoming";
  const isOutgoing = call.status === "outgoing";
  const isActive = call.status === "active";
  const isEnding = call.status === "ended" || call.status === "declined";
  const showVideoStage = isVideo && (isActive || isOutgoing);

  let subtitle = "";
  if (isOutgoing) subtitle = isVideo ? "Video calling…" : "Calling…";
  else if (isIncoming) subtitle = isVideo ? "Incoming video call" : "Incoming audio call";
  else if (isActive) subtitle = formatDuration(call.duration);
  else if (call.status === "declined") subtitle = "Call declined";
  else if (call.status === "ended") subtitle = "Call ended";

  return (
    <div
      className="fixed left-0 right-0 z-50 flex flex-col items-center justify-between bg-background/97 backdrop-blur-xl px-6 animate-fade-in-up overflow-hidden"
      style={{
        // Follow the visible area so the keyboard never hides the call chat.
        top: "var(--app-top, 0px)",
        height: "var(--app-h, 100dvh)",
        paddingTop: "max(3.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(3.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <audio ref={audioRef} autoPlay playsInline />

      {showVideoStage && (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-black -z-10"
          />
          <div className="absolute inset-0 bg-black/30 -z-10" />
          <div
            className="absolute w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden border border-white/15 shadow-soft bg-black"
            style={{
              top: "max(1rem, env(safe-area-inset-top))",
              right: "1rem",
            }}
          >
            {call.cameraOff ? (
              <div className="w-full h-full flex items-center justify-center bg-card text-muted text-xs">
                Camera off
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}
          </div>
        </>
      )}

      <div />

      <div className="flex flex-col items-center gap-4">
        {!showVideoStage && (
          <div
            className={`w-28 h-28 rounded-full bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center text-4xl font-semibold text-white shadow-glow ${
              isOutgoing || isIncoming ? "animate-pulse-dot" : ""
            }`}
          >
            {call.otherAvatar}
          </div>
        )}
        <div className="text-center">
          <h2
            className={`text-2xl font-semibold ${
              showVideoStage ? "text-white drop-shadow" : "text-ink"
            }`}
          >
            {call.otherName}
          </h2>
          <p
            className={`mt-1 text-sm ${
              isActive
                ? showVideoStage
                  ? "text-white/90 drop-shadow"
                  : "text-accent"
                : showVideoStage
                ? "text-white/80 drop-shadow"
                : "text-muted"
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {isIncoming && (
          <>
            <button
              onClick={call.declineCall}
              aria-label="Decline call"
              className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500 text-white shadow-soft hover:brightness-110 active:scale-95 transition-all"
            >
              <HiPhoneXMark className="text-2xl" />
            </button>
            <button
              onClick={call.acceptCall}
              aria-label="Accept call"
              className="w-16 h-16 flex items-center justify-center rounded-full bg-accent text-white shadow-soft hover:brightness-110 active:scale-95 transition-all"
            >
              <HiPhone className="text-2xl" />
            </button>
          </>
        )}

        {(isOutgoing || isActive) && (
          <>
            {isActive && (
              <button
                onClick={call.toggleMute}
                aria-label={call.muted ? "Unmute microphone" : "Mute microphone"}
                className={`w-14 h-14 flex items-center justify-center rounded-full border border-white/10 transition-all active:scale-95 ${
                  call.muted
                    ? "bg-white/10 text-ink"
                    : showVideoStage
                    ? "bg-black/40 text-white"
                    : "bg-card text-muted hover:text-ink"
                }`}
              >
                {call.muted ? (
                  <HiSpeakerXMark className="text-xl" />
                ) : (
                  <HiMicrophone className="text-xl" />
                )}
              </button>
            )}

            {isActive && isVideo && (
              <button
                onClick={call.toggleCamera}
                aria-label={call.cameraOff ? "Turn camera on" : "Turn camera off"}
                className={`w-14 h-14 flex items-center justify-center rounded-full border border-white/10 transition-all active:scale-95 ${
                  call.cameraOff
                    ? "bg-white/10 text-ink"
                    : "bg-black/40 text-white"
                }`}
              >
                {call.cameraOff ? (
                  <HiVideoCameraSlash className="text-xl" />
                ) : (
                  <HiVideoCamera className="text-xl" />
                )}
              </button>
            )}

            {isActive && chat && (
              <CallChat
                messages={chat.messages}
                myId={chat.myId}
                onSend={chat.onSend}
                showVideoStage={showVideoStage}
              />
            )}

            <button
              onClick={call.hangUp}
              aria-label="End call"
              className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500 text-white shadow-soft hover:brightness-110 active:scale-95 transition-all"
            >
              <HiPhoneXMark className="text-2xl" />
            </button>
          </>
        )}

        {isEnding && <div className="h-16" />}
      </div>
    </div>
  );
}