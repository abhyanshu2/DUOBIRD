import { useMemo } from "react";
import MessageBubble from "./MessageBubble";
import DayDivider from "./DayDivider";
import EmptyState from "./EmptyState";
import TypingIndicator from "./TypingIndicator";
import { useAutoScroll } from "../hooks/useAutoScroll";
import { formatDayLabel } from "../utils/formatTime";
import { scrollToMessage } from "../utils/scrollToMessage";

export default function MessageList({
  messages,
  myId,
  themName,
  themAvatar,
  theirLastSeen,
  theirTyping,
  pinnedMessageId,
  onReply,
  onEdit,
  onDelete,
  onPin,
}) {
  const { containerRef, bottomRef, handleScroll } = useAutoScroll(
    messages.length + (theirTyping ? 1 : 0)
  );

  const rows = useMemo(() => {
    const out = [];
    let lastDay = null;

    messages.forEach((msg) => {
      const dayLabel = msg.createdAt ? formatDayLabel(msg.createdAt) : null;
      if (dayLabel && dayLabel !== lastDay) {
        out.push({ type: "divider", key: `divider-${msg.id}`, label: dayLabel });
        lastDay = dayLabel;
      }
      out.push({ type: "message", key: msg.id, msg });
    });

    return out;
  }, [messages]);

  const jumpToMessage = (id) => scrollToMessage(id);

  if (messages.length === 0 && !theirTyping) {
    return <EmptyState themName={themName} />;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-3 sm:px-4 py-4 space-y-2 scroll-smooth"
    >
      {rows.map((row) =>
        row.type === "divider" ? (
          <DayDivider key={row.key} label={row.label} />
        ) : (
          <MessageBubble
            key={row.key}
            id={row.msg.id}
            type={row.msg.type || "text"}
            text={row.msg.message}
            audioUrl={row.msg.audioUrl}
            durationSec={row.msg.durationSec}
            replyTo={row.msg.replyTo}
            edited={row.msg.edited}
            deleted={row.msg.deleted}
            createdAt={row.msg.createdAt}
            isMine={row.msg.sender === myId}
            pending={!row.msg.createdAt}
            avatar={themAvatar}
            isPinned={pinnedMessageId === row.msg.id}
            onReply={() => onReply?.(row.msg)}
            onEdit={() => onEdit?.(row.msg)}
            onDelete={() => onDelete?.(row.msg)}
            onPin={() => onPin?.(row.msg)}
            onJumpTo={jumpToMessage}
            seen={
              row.msg.sender === myId &&
              row.msg.createdAt &&
              theirLastSeen &&
              theirLastSeen.getTime() >= row.msg.createdAt.toDate().getTime()
            }
          />
        )
      )}
      {theirTyping && <TypingIndicator avatar={themAvatar} />}
      <div ref={bottomRef} />
    </div>
  );
}