import { HiExclamationTriangle, HiArrowPath } from "react-icons/hi2";

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 text-red-300 text-sm px-4 py-3 mx-3 mt-3 rounded-xl animate-fade-in-up">
      <HiExclamationTriangle className="text-lg shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-xs font-semibold text-red-200 hover:text-white transition-colors"
        >
          <HiArrowPath /> Retry
        </button>
      )}
    </div>
  );
}
