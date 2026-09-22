export default function LoadingState({ label = "Connecting…" }) {
  return (
    <div className="app-min-height bg-background flex flex-col items-center justify-center gap-3">
      <div className="flex gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-dot [animation-delay:0ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-dot [animation-delay:200ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse-dot [animation-delay:400ms]" />
      </div>
      <p className="text-muted text-sm">{label}</p>
    </div>
  );
}
