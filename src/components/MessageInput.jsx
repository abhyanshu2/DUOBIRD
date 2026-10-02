import { useEffect, useRef, useState } from "react";
import {
  HiFaceSmile,
  HiPaperAirplane,
  HiMicrophone,
  HiTrash,
  HiStop,
  HiXMark,
  HiPencilSquare,
  HiArrowUturnLeft,
} from "react-icons/hi2";
import EmojiPicker from "./EmojiPicker";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function MessageInput({
  onSend,
  onSendVoice,
  onSaveEdit,
  disabled,
  onTyping,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const textareaRef = useRef(null);
  const recorder = useVoiceRecorder();

  // Prefill the box when an edit starts, and focus it.
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.message || "");
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  const resetBox = () => {
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSend = () => {
    if (disabled || recorder.recording) return;

    if (editingMessage) {
      const trimmed = text.trim();
      if (!trimmed) return;
      onSaveEdit?.(editingMessage.id, trimmed);
      resetBox();
      return;
    }

    if (!text.trim()) return;
    onSend(text);
    resetBox();
    onTyping?.(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape" && editingMessage) {
      onCancelEdit?.();
      resetBox();
    }
  };

  const insertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
    onTyping?.(true);
    textareaRef.current?.focus();
  };

  const autoGrow = (e) => {
    const value = e.target.value;
    setText(value);
    if (!editingMessage) onTyping?.(value.trim().length > 0);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleMicTap = () => {
    if (editingMessage) return;
    recorder.start();
  };

  const handleCancelRecording = () => recorder.cancel();

  const handleFinishRecording = async () => {
    const result = await recorder.stop();
    if (!result) return;
    setSendingVoice(true);
    try {
      await onSendVoice?.(result.blob, result.durationSec);
    } catch (err) {
      console.error("Failed to send voice note:", err);
    } finally {
      setSendingVoice(false);
    }
  };

  const quote =
    !editingMessage && replyingTo
      ? {
          text:
            replyingTo.type === "voice"
              ? "Voice message"
              : replyingTo.deleted
              ? "Message deleted"
              : replyingTo.message,
          onCancel: onCancelReply,
        }
      : null;

  return (
    <div className="shrink-0 bg-card/95 backdrop-blur-xl border-t border-ink/10 px-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
      {editingMessage && (
        <div className="mb-2 flex items-center gap-2 bg-card border border-primary/30 rounded-xl px-3 py-2">
          <HiPencilSquare className="text-primary text-sm shrink-0" />
          <span className="flex-1 text-xs text-muted truncate">Editing your message</span>
          <button
            onClick={() => {
              onCancelEdit?.();
              resetBox();
            }}
            aria-label="Cancel edit"
            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-ink/10"
          >
            <HiXMark className="text-sm" />
          </button>
        </div>
      )}

      {quote && (
        <div className="mb-2 flex items-center gap-2 bg-background border border-ink/10 rounded-xl px-3 py-2">
          <HiArrowUturnLeft className="text-primary text-sm shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-primary font-medium">Replying</p>
            <p className="text-xs text-muted truncate">{quote.text}</p>
          </div>
          <button
            onClick={quote.onCancel}
            aria-label="Cancel reply"
            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-ink/10"
          >
            <HiXMark className="text-sm" />
          </button>
        </div>
      )}

      {recorder.error && (
        <p className="text-xs text-red-600 dark:text-red-400 mb-2 px-1">{recorder.error}</p>
      )}

      {recorder.recording ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancelRecording}
            aria-label="Cancel recording"
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <HiTrash className="text-lg" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-background rounded-chat border border-ink/10 px-4 py-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-dot shrink-0" />
            <span className="text-sm text-ink tabular-nums">
              {formatDuration(recorder.elapsed)}
            </span>
            <span className="text-xs text-muted ml-auto">
              max {formatDuration(recorder.maxDuration)}
            </span>
          </div>

          <button
            onClick={handleFinishRecording}
            aria-label="Send voice note"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primaryDark text-white transition-all duration-200 hover:brightness-110 active:scale-95 shadow-glow"
          >
            <HiStop className="text-lg" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <div className="relative">
            <button
              onClick={() => setShowEmoji((v) => !v)}
              disabled={disabled}
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              aria-label="Add emoji"
            >
              <HiFaceSmile className="text-2xl" />
            </button>
            {showEmoji && (
              <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />
            )}
          </div>

          <div className="flex-1 flex items-end bg-background rounded-chat border border-ink/10 focus-within:border-primary/60 transition-colors px-4 py-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={autoGrow}
              onBlur={() => onTyping?.(false)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={editingMessage ? "Edit your message" : "Type a message"}
              rows={1}
              className="flex-1 resize-none bg-transparent outline-none text-ink placeholder:text-muted text-base sm:text-[15px] leading-relaxed max-h-[120px] py-1 disabled:opacity-50"
            />
          </div>

          {!editingMessage && !text.trim() ? (
            <button
              onClick={handleMicTap}
              disabled={disabled || sendingVoice}
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primaryDark text-white disabled:bg-ink/10 disabled:bg-none disabled:text-muted transition-all duration-200 hover:brightness-110 active:scale-95 shadow-glow disabled:shadow-none"
              aria-label="Record a voice note"
            >
              {sendingVoice ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <HiMicrophone className="text-lg" />
              )}
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={disabled || !text.trim()}
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primaryDark text-white disabled:bg-ink/10 disabled:bg-none disabled:text-muted transition-all duration-200 hover:brightness-110 active:scale-95 shadow-glow disabled:shadow-none"
              aria-label={editingMessage ? "Save edit" : "Send message"}
            >
              <HiPaperAirplane className="text-lg -ml-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}