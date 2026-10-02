import {
  HiEllipsisVertical,
  HiArrowLeftOnRectangle,
  HiPhone,
  HiVideoCamera,
  HiTrash,
  HiArrowRightStartOnRectangle,
  HiClock,
} from "react-icons/hi2";
import { useState } from "react";

export default function ChatHeader({
  them,
  isOnline,
  onSwitchUser,
  onLeaveRoom,
  onStartCall,
  onStartVideoCall,
  callDisabled,
  onClearChat,
  disappearing,
  onToggleDisappearing,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="shrink-0 relative z-20 flex items-center justify-between px-4 pb-3 bg-card/90 backdrop-blur-xl border-b border-ink/10 [padding-top:max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primaryDark flex items-center justify-center text-white font-semibold">
            {them?.avatar}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
              isOnline ? "bg-accent" : "bg-slate-500"
            }`}
          />
        </div>
        <div className="min-w-0">
          <h2 className="text-ink font-semibold truncate leading-tight">
            {them?.name}
          </h2>
          <p className="text-xs text-muted leading-tight">
            {isOnline ? (
              <span className="text-accent">Active now</span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onStartCall}
          disabled={callDisabled}
          className="w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
          aria-label={`Audio call ${them?.name || ""}`}
        >
          <HiPhone className="text-lg" />
        </button>

        <button
          onClick={onStartVideoCall}
          disabled={callDisabled}
          className="w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
          aria-label={`Video call ${them?.name || ""}`}
        >
          <HiVideoCamera className="text-lg" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-ink/5 transition-colors"
            aria-label="More options"
          >
            <HiEllipsisVertical className="text-xl" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-11 z-20 bg-card border border-ink/10 rounded-xl shadow-soft overflow-hidden w-64 animate-pop-in">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleDisappearing?.();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-ink hover:bg-ink/5 transition-colors"
                >
                  <HiClock className={disappearing ? "text-primary" : "text-muted"} />
                  <span className="flex-1 text-left">Disappearing messages</span>
                  <span
                    className={`text-xs font-medium ${
                      disappearing ? "text-primary" : "text-muted"
                    }`}
                  >
                    {disappearing ? "24h · On" : "Off"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSwitchUser();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-ink hover:bg-ink/5 transition-colors border-t border-ink/10"
                >
                  <HiArrowLeftOnRectangle className="text-muted" />
                  Switch identity
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onClearChat();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors border-t border-ink/10"
                >
                  <HiTrash />
                  Clear chat
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLeaveRoom();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted hover:text-ink hover:bg-ink/5 transition-colors border-t border-ink/10"
                >
                  <HiArrowRightStartOnRectangle />
                  Leave this room
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}