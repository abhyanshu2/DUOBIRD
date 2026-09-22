export default function DayDivider({ label }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-[11px] font-medium text-muted bg-card px-3 py-1 rounded-full border border-white/5">
        {label}
      </span>
    </div>
  );
}
