import { useRef, useState } from "react";
import {
  HiCheck,
  HiEllipsisHorizontal,
  HiArrowUturnLeft,
  HiPencilSquare,
  HiTrash,
  HiMapPin,
} from "react-icons/hi2";
import { formatTime } from "../utils/formatTime";
import VoiceMessage from "./VoiceMessage";

// Swipe-to-reply tuning (px): how far you must drag to trigger a reply,
// and how far the message is allowed to travel.
const SWIPE_TRIGGER = 56;
const SWIPE_MAX = 72;

function SeenTicks({ seen }) {
  return (
    <span className={seen ? "text-primary" : "text-muted"}>
      {seen ? (
        <span className="relative inline-flex w-3.5 h-3.5 items-center justify-center">
          <HiCheck className="text-[13px] absolute -left-0.5" />
          <HiCheck className="text-[13px] absolute left-1" />
        </span>
      ) : (
        <HiCheck className="text-[13px]" />
      )}
    </span>
  );
}

function ReplyQuote({ replyTo, isMine, onJump }) {
  if (!replyTo) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onJump?.(replyTo.id);
      }}
      className={`block w-full min-w-0 overflow-hidden text-left mb-1.5 px-2.5 py-1.5 rounded-lg border-l-2 ${
        isMine
          ? "bg-white/10 border-white/40"
          : "bg-ink/5 border-primary/60"
      }`}
    >
      <p className={`text-[10px] font-medium truncate ${isMine ? "text-white/80" : "text-primary"}`}>
        {replyTo.sender}
      </p>
      <p className={`text-[11px] truncate ${isMine ? "text-white/70" : "text-muted"}`}>
        {replyTo.preview || "Message"}
      </p>
    </button>
  );
}

export default function MessageBubble({
  id,
  type = "text",
  text,
  audioUrl,
  durationSec,
  replyTo,
  edited,
  deleted,
  createdAt,
  isMine,
  pending,
  avatar,
  seen,
  isPinned,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onJumpTo,
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
  const justSwipedRef = useRef(false);
  const isVoice = type === "voice" && audioUrl && !deleted;

  const close = () => setActionsOpen(false);

  // Swipe a message to the right to reply to it (like WhatsApp).
  const onPointerDown = (e) => {
    if (deleted || e.pointerType === "mouse") return;
    justSwipedRef.current = false;
    dragRef.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      fired: false,
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.active) {
      // Mostly vertical, or to the left: that's scrolling, not a reply swipe.
      if (Math.abs(dy) > 10 || dx < -10) {
        dragRef.current = null;
        return;
      }
      if (dx < 10 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      d.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }

    const x = Math.min(Math.max(dx, 0), SWIPE_MAX);
    setDragX(x);
    if (!d.fired && x >= SWIPE_TRIGGER) {
      d.fired = true;
      navigator.vibrate?.(15);
    } else if (d.fired && x < SWIPE_TRIGGER) {
      d.fired = false;
    }
  };

  const endSwipe = (e, cancelled) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    dragRef.current = null;
    if (!d.active) return;
    justSwipedRef.current = true; // don't treat the release as a tap
    setDragging(false);
    setDragX(0);
    if (d.fired && !cancelled) onReply?.();
  };

  const swipeProgress = Math.min(dragX / SWIPE_TRIGGER, 1);

  return (
    <div
      id={`msg-${id}`}
      className={`flex w-full min-w-0 items-end gap-1.5 ${
        isMine ? "justify-end" : "justify-start"
      } animate-fade-in-up scroll-mt-20`}
    >
      {!isMine && (
        <div className="w-6 h-6 rounded-full bg-ink/10 text-muted text-[10px] font-semibold flex items-center justify-center shrink-0 mb-0.5">
          {avatar}
        </div>
      )}

      <div
        className={`relative flex flex-col min-w-0 max-w-[78%] sm:max-w-[65%] ${
          isMine ? "items-end" : "items-start"
        }`}
        // Only set a transform while swiping: a permanent one would break the
        // full-screen click-catcher of the message menu.
        style={{
          transform: dragX ? `translateX(${dragX}px)` : undefined,
          transition: dragging ? "none" : "transform 0.2s ease-out",
        }}
      >
        {dragX > 0 && (
          <div
            aria-hidden="true"
            className="absolute right-full top-1/2 -mt-4 mr-2 w-8 h-8 flex items-center justify-center rounded-full bg-ink/10 text-primary pointer-events-none"
            style={{
              opacity: swipeProgress,
              transform: `scale(${0.5 + 0.5 * swipeProgress})`,
            }}
          >
            <HiArrowUturnLeft className="text-base" />
          </div>
        )}

        {isPinned && (
          <span
            className={`flex items-center gap-1 text-[10px] text-muted mb-1 ${
              isMine ? "flex-row-reverse" : ""
            }`}
          >
            <HiMapPin className="text-[11px]" />
            Pinned
          </span>
        )}

        <div className="group relative min-w-0 max-w-full">
          <div
            onClick={() => {
              if (justSwipedRef.current) {
                justSwipedRef.current = false;
                return;
              }
              if (!deleted) setActionsOpen((v) => !v);
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endSwipe(e, false)}
            onPointerCancel={(e) => endSwipe(e, true)}
            style={{ touchAction: "pan-y" }}
            className={`px-3 py-2 shadow-soft cursor-pointer min-w-0 max-w-full overflow-hidden ${
              isMine
                ? "bg-gradient-to-br from-primary to-primaryDark text-white rounded-2xl rounded-tr-sm"
                : "bg-bubble text-ink rounded-2xl rounded-tl-sm"
            } ${pending ? "opacity-60" : "opacity-100"}`}
          >
            {!deleted && <ReplyQuote replyTo={replyTo} isMine={isMine} onJump={onJumpTo} />}

            {deleted ? (
              <p className={`text-sm italic ${isMine ? "text-white/70" : "text-muted"}`}>
                This message was deleted
              </p>
            ) : isVoice ? (
              <VoiceMessage audioUrl={audioUrl} durationSec={durationSec} isMine={isMine} />
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                {text}
              </p>
            )}
          </div>

          {actionsOpen && !deleted && (
            <>
              <div className="fixed inset-0 z-10" onClick={close} />
              <div
                className={`absolute z-20 top-full mt-1 flex items-center gap-0.5 bg-card border border-ink/10 rounded-full shadow-soft px-1 py-1 animate-pop-in ${
                  isMine ? "right-0" : "left-0"
                }`}
              >
                <button
                  onClick={() => {
                    onReply?.();
                    close();
                  }}
                  aria-label="Reply"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-ink/10"
                >
                  <HiArrowUturnLeft className="text-sm" />
                </button>
                {isMine && type === "text" && (
                  <button
                    onClick={() => {
                      onEdit?.();
                      close();
                    }}
                    aria-label="Edit"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-ink/10"
                  >
                    <HiPencilSquare className="text-sm" />
                  </button>
                )}
                <button
                  onClick={() => {
                    onPin?.();
                    close();
                  }}
                  aria-label={isPinned ? "Unpin" : "Pin"}
                  className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-ink/10 ${
                    isPinned ? "text-primary" : "text-muted hover:text-ink"
                  }`}
                >
                  <HiMapPin className="text-sm" />
                </button>
                {isMine && (
                  <button
                    onClick={() => {
                      onDelete?.();
                      close();
                    }}
                    aria-label="Delete"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10"
                  >
                    <HiTrash className="text-sm" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1 px-0.5">
          {edited && !deleted && (
            <span className="text-[10px] text-muted italic">edited</span>
          )}
          <span className="text-[10px] text-muted">{formatTime(createdAt)}</span>
          {isMine && !pending && <SeenTicks seen={seen} />}
          {!actionsOpen && !deleted && (
            <button
              onClick={() => setActionsOpen(true)}
              aria-label="More"
              className="opacity-0 group-hover:opacity-100 sm:opacity-40 sm:hover:opacity-100 transition-opacity text-muted"
            >
              <HiEllipsisHorizontal className="text-sm" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}