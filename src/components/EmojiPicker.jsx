const EMOJIS = [
  "😀", "😂", "🥹", "😍", "😘", "😉", "😎", "🤔",
  "😴", "😢", "😭", "😡", "🥳", "😇", "🙃", "🤗",
  "👍", "👎", "🙏", "👏", "💪", "🤝", "✌️", "🤞",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔",
  "🔥", "✨", "🎉", "🎂", "☕", "🍕", "🌙", "⭐",
];

export default function EmojiPicker({ onSelect, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute bottom-14 left-0 z-20 bg-card border border-ink/10 rounded-2xl shadow-soft p-3 w-[min(18rem,80vw)] animate-pop-in">
        <div className="grid grid-cols-8 gap-1">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="text-xl leading-none aspect-square flex items-center justify-center rounded-lg hover:bg-ink/10 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}