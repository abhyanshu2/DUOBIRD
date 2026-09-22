import { HiChatBubbleOvalLeft } from "react-icons/hi2";

export default function EmptyState({ themName }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-fade-in-up">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
        <HiChatBubbleOvalLeft className="text-primary text-3xl" />
      </div>
      <h3 className="text-ink font-semibold text-lg">
        Say hello to {themName}
      </h3>
      <p className="text-muted text-sm mt-1.5 max-w-[240px]">
        This is the very start of your private conversation. Nobody else can
        see it.
      </p>
    </div>
  );
}
