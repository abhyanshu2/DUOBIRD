import { useEffect, useRef, useState } from "react";
import {
  HiPhone,
  HiPhoneXMark,
  HiMicrophone,
  HiSpeakerXMark,
  HiVideoCamera,
  HiVideoCameraSlash,
  HiArrowPath,
  HiArrowsPointingIn,
  HiArrowsPointingOut,
} from "react-icons/hi2";
import CallChat from "./CallChat";

// Size of the small floating video window and how close it may get to the edge.
const MINI_W = 112;
const MINI_H = 160;
const EDGE = 8;
const DOUBLE_TAP_MS = 320;

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function viewportSize() {
  const vv = window.visualViewport;
  return {
    w: vv ? vv.width : window.innerWidth,
    h: vv ? vv.height : window.innerHeight,
  };
}

// Keeps the floating window fully on screen.
function clampPos(x, y) {
  const { w, h } = viewportSize();
  return {
    x: Math.min(Math.max(x, EDGE), Math.max(EDGE, w - MINI_W - EDGE)),
    y: Math.min(Math.max(y, EDGE), Math.max(EDGE, h - MINI_H - EDGE)),
  };
}

export default function CallOverlay({ call, chat }) {
  const audioRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  // Floating (minimized) video window state.
  const [minimized, setMinimized] = useState(false);
  const [pos, setPos] = useState(null); // { x, y } of the floating window
  const [chatKey, setChatKey] = useState(0); // bumped on maximize to reset call-chat unread
  const dragRef = useRef(null);
  const lastTapRef = useRef(0);

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
  }, [call.localStream, call.cameraOff]);

  // New call / call over: go back to the normal full-screen layout.
  useEffect(() => {
    if (call.status === "idle") {
      setMinimized(false);
      setPos(null);
    }
  }, [call.status]);

  // Keep the floating window on screen if the phone rotates or the keyboard moves things.
  useEffect(() => {
    if (!minimized) return undefined;
    const onResize = () => setPos((p) => (p ? clampPos(p.x, p.y) : p));
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [minimized]);

  if (call.status === "idle") return null;

  const isIncoming = call.status === "incoming";
  const isOutgoing = call.status === "outgoing";
  const isActive = call.status === "active";
  const isEnding = call.status === "ended" || call.status === "declined";
  const showVideoStage = isVideo && (isActive || isOutgoing);
  const mini = Boolean(minimized && pos && isVideo && isActive);
  const hideInMini = mini ? "hidden" : "";

  const minimize = () => {
    const { w } = viewportSize();
    setPos((p) => p || clampPos(w - MINI_W - 12, 76));
    setMinimized(true);
  };

  const maximize = () => {
    setChatKey((k) => k + 1);
    setMinimized(false);
  };

  // Drag the floating window with a finger; a quick double tap opens full screen.
  const onPointerDown = (e) => {
    if (!mini) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    setPos(clampPos(d.origX + dx, d.origY + dy));
  };

  const onPointerUp = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (d.moved) return;
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      maximize();
    } else {
      lastTapRef.current = now;
    }
  };

  const onPointerCancel = () => {
    dragRef.current = null;
  };

  let subtitle = "";
  if (isOutgoing) subtitle = isVideo ? "Video calling…" : "Calling…";
  else if (isIncoming) subtitle = isVideo ? "Incoming video call" : "Incoming audio call";
  else if (isActive) subtitle = formatDuration(call.duration);
  else if (call.status === "declined") subtitle = "Call declined";
  else if (call.status === "ended") subtitle = "Call ended";

  const rootClass = mini
    ? "fixed z-50 overflow-hidden rounded-2xl border border-white/25 bg-black shadow-soft select-none cursor-grab active:cursor-grabbing"
    : "fixed left-0 right-0 z-50 flex flex-col items-center justify-between bg-background/97 backdrop-blur-xl px-6 animate-fade-in-up overflow-hidden";

  const rootStyle = mini
    ? {
        left: pos.x,
        top: `calc(var(--app-top, 0px) + ${pos.y}px)`,
        width: MINI_W,
        height: MINI_H,
        touchAction: "none",
      }
    : {
        // Follow the visible area so the keyboard never hides the call chat.
        top: "var(--app-top, 0px)",
        height: "var(--app-h, 100dvh)",
        paddingTop: "max(3.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(3.5rem, env(safe-area-inset-bottom))",
      };

  const roundBtn = (extra) =>
    `w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full border border-ink/10 transition-all active:scale-95 ${extra}`;

  return (
    <div
      className={rootClass}
      style={rootStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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
          <div className={`absolute inset-0 bg-black/30 -z-10 ${hideInMini}`} />
          <div
            className={`absolute w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden border border-white/15 shadow-soft bg-black ${hideInMini}`}
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
                className={`w-full h-full object-cover ${
                  call.facing === "environment" ? "" : "scale-x-[-1]"
                }`}
              />
            )}
          </div>
        </>
      )}

      {/* Minimize button (full-screen video call only) */}
      {isActive && isVideo && !mini && (
        <button
          onClick={minimize}
          aria-label="Minimize video"
          className="absolute w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white border border-ink/10 active:scale-95 transition-all"
          style={{ top: "max(1rem, env(safe-area-inset-top))", left: "1rem" }}
        >
          <HiArrowsPointingIn className="text-lg" />
        </button>
      )}

      {/* Extras shown only on the small floating window */}
      {mini && (
        <>
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-medium">
            {formatDuration(call.duration)}
          </span>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={maximize}
            aria-label="Open full screen"
            className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white"
          >
            <HiArrowsPointingOut className="text-sm" />
          </button>
          <span className="absolute bottom-1.5 left-2 right-2 text-[11px] text-white drop-shadow truncate">
            {call.otherName}
          </span>
        </>
      )}

      <div className={hideInMini} />

      <div className={`flex flex-col items-center gap-4 ${hideInMini}`}>
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

      <div
        className={`flex items-center ${
          isIncoming ? "gap-6" : "gap-3 sm:gap-6"
        } ${hideInMini}`}
      >
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
                className={roundBtn(
                  call.muted
                    ? showVideoStage
                      ? "bg-white/30 text-white"
                      : "bg-ink/10 text-ink"
                    : showVideoStage
                    ? "bg-black/40 text-white"
                    : "bg-card text-muted hover:text-ink"
                )}
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
                className={roundBtn(
                  call.cameraOff ? "bg-white/30 text-white" : "bg-black/40 text-white"
                )}
              >
                {call.cameraOff ? (
                  <HiVideoCameraSlash className="text-xl" />
                ) : (
                  <HiVideoCamera className="text-xl" />
                )}
              </button>
            )}

            {isActive && isVideo && (
              <button
                onClick={call.switchCamera}
                aria-label="Switch front/back camera"
                className={roundBtn("bg-black/40 text-white")}
              >
                <HiArrowPath className="text-xl" />
              </button>
            )}

            {isActive && chat && (
              <CallChat
                key={chatKey}
                messages={chat.messages}
                myId={chat.myId}
                onSend={chat.onSend}
                showVideoStage={showVideoStage}
              />
            )}

            <button
              onClick={call.hangUp}
              aria-label="End call"
              className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full bg-red-500 text-white shadow-soft hover:brightness-110 active:scale-95 transition-all"
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