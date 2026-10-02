import { HiMapPin, HiXMark } from "react-icons/hi2";

export default function PinnedBanner({ pinned, onJump, onUnpin }) {
  if (!pinned) return null;

  return (
    <button
      onClick={() => onJump?.(pinned.messageId)}
      className="w-full flex items-center gap-2.5 px-4 py-2 bg-primary/10 border-b border-primary/20 text-left hover:bg-primary/15 transition-colors"
    >
      <HiMapPin className="text-primary text-sm shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-primary font-medium leading-tight">Pinned message</p>
        <p className="text-xs text-ink/80 truncate leading-tight">{pinned.preview}</p>
      </div>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onUnpin?.();
        }}
        role="button"
        aria-label="Unpin"
        className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-ink/10 transition-colors"
      >
        <HiXMark className="text-sm" />
      </span>
    </button>
  );
}