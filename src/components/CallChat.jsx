import { useEffect, useRef, useState } from "react";
import { HiChatBubbleLeftRight, HiPaperAirplane, HiXMark } from "react-icons/hi2";

function previewText(msg) {
  if (msg.deleted) return "Message deleted";
  if (msg.type === "voice") return "Voice message";
  return msg.message || "";
}

/**
 * Chat that lives inside an active call: a button (with unread badge), a
 * small pop-up for new messages, and a slide-up panel with the recent thread.
 * It reuses the same messages as the main chat, so nothing gets duplicated.
 */
export default function CallChat({ messages, myId, onSend, showVideoStage }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [toast, setToast] = useState(null);
  // How many messages existed when the call started / panel was last open.
  const [seenCount, setSeenCount] = useState(messages.length);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const unread = open
    ? 0
    : messages.slice(seenCount).filter((m) => m.sender !== myId).length;

  // Panel open = everything is read.
  useEffect(() => {
    if (open) setSeenCount(messages.length);
  }, [open, messages.length]);

  // Pop-up for a new incoming message while the panel is closed.
  useEffect(() => {
    if (open) return undefined;
    const last = messages[messages.length - 1];
    if (!last || messages.length <= seenCount || last.sender === myId) return undefined;
    setToast({ id: last.id, text: previewText(last) });
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, open]);

  // Keep the panel's own list scrolled to the newest message.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages.length]);

  const openPanel = () => {
    setToast(null);
    setOpen(true);
  };

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onSend(value);
    setText("");
    inputRef.current?.focus();
  };

  const recent = messages.slice(-40);

  return (
    <>
      <button
        onClick={open ? () => setOpen(false) : openPanel}
        aria-label={open ? "Close chat" : "Open chat"}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full border border-white/10 transition-all active:scale-95 ${
          open
            ? "bg-primary text-white"
            : showVideoStage
            ? "bg-black/40 text-white"
            : "bg-card text-muted hover:text-ink"
        }`}
      >
        <HiChatBubbleLeftRight className="text-xl" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-accent text-white text-[10px] font-semibold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {toast && !open && (
        <button
          onClick={openPanel}
          className="absolute left-4 right-4 z-20 mx-auto max-w-sm text-left bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-soft px-3.5 py-2.5 animate-fade-in-up"
          style={{ bottom: "calc(max(3.5rem, env(safe-area-inset-bottom)) + 5.5rem)" }}
        >
          <p className="text-[13px] text-ink truncate">{toast.text}</p>
        </button>
      )}

      {open && (
        <div className="absolute inset-x-0 bottom-0 z-30 max-h-[70%] flex flex-col bg-card/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-soft animate-fade-in-up">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
            <span className="text-sm font-semibold text-ink">Chat</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-white/10"
            >
              <HiXMark className="text-lg" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-2 space-y-1.5"
          >
            {recent.length === 0 && (
              <p className="text-xs text-muted text-center py-6">No messages yet</p>
            )}
            {recent.map((m) => {
              const mine = m.sender === myId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] min-w-0 px-3 py-1.5 rounded-2xl text-[13px] leading-snug whitespace-pre-wrap [overflow-wrap:anywhere] ${
                      mine
                        ? "bg-gradient-to-br from-primary to-primaryDark text-white rounded-tr-sm"
                        : "bg-white/10 text-ink rounded-tl-sm"
                    } ${m.deleted || m.type === "voice" ? "italic opacity-80" : ""}`}
                  >
                    {previewText(m)}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="flex items-center gap-2 px-3 pt-2 shrink-0 border-t border-white/5"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Type a message"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-ink placeholder:text-muted outline-none focus:border-primary/60 transition-colors"
            />
            <button
              onClick={submit}
              disabled={!text.trim()}
              aria-label="Send message"
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primaryDark text-white disabled:bg-white/10 disabled:bg-none disabled:text-muted transition-all active:scale-95"
            >
              <HiPaperAirplane className="text-base -ml-0.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}