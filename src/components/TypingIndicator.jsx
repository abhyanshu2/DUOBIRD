export default function TypingIndicator({ avatar }) {
  return (
    <div className="flex items-end gap-1.5 animate-fade-in-up">
      <div className="w-6 h-6 rounded-full bg-ink/10 text-muted text-[10px] font-semibold flex items-center justify-center shrink-0">
        {avatar}
      </div>
      <div className="bg-bubble rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse-dot [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse-dot [animation-delay:200ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse-dot [animation-delay:400ms]" />
      </div>
    </div>
  );
}