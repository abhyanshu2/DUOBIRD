export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/50 backdrop-blur-sm animate-fade-in-up">
      <div className="w-full max-w-sm bg-card border border-ink/10 rounded-2xl shadow-soft p-5 animate-pop-in">
        <h3 className="text-ink font-semibold text-lg">{title}</h3>
        {message && (
          <p className="mt-2 text-sm text-muted leading-relaxed">{message}</p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium rounded-xl text-muted hover:text-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition-colors disabled:opacity-60 ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-primary hover:brightness-110"
            }`}
          >
            {busy ? "Clearing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}