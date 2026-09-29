import { useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ErrorBanner from "./ErrorBanner";
import ConfirmDialog from "./ConfirmDialog";
import CallOverlay from "./CallOverlay";
import PinnedBanner from "./PinnedBanner";
import { useIdentity } from "../context/IdentityContext";
import { useMessages } from "../hooks/useMessages";
import { usePresence } from "../hooks/usePresence";
import { useTyping } from "../hooks/useTyping";
import { useCall } from "../hooks/useCall";
import { usePinnedMessage } from "../hooks/usePinnedMessage";
import { scrollToMessage } from "../utils/scrollToMessage";
import { useViewportLock } from "../hooks/useViewportLock";

export default function ChatRoom() {
  useViewportLock();
  const { roomId, me, them, clearIdentity, leaveRoom } = useIdentity();
  const { messages, status, error, send, sendVoice, editMessage, deleteMessage, clearChat } =
    useMessages(roomId);
  const { theirOnline, theirLastSeen } = usePresence(roomId, me.id, them.id);
  const { theirTyping, setTyping } = useTyping(roomId, me.id, them.id);
  const call = useCall(roomId, me.id, them.id, them.name, them.avatar);
  const { pinned, pinMessage, unpinMessage } = usePinnedMessage(roomId);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const handleSend = (text) => {
    send(text, me.id, replyingTo).catch((err) => {
      console.error("Failed to send message:", err);
    });
    setReplyingTo(null);
  };

  const handleSendVoice = async (blob, durationSec) => {
    await sendVoice(blob, me.id, durationSec, replyingTo);
    setReplyingTo(null);
  };

  const handleSaveEdit = async (id, text) => {
    try {
      await editMessage(id, text);
    } catch (err) {
      console.error("Failed to save edit:", err);
    } finally {
      setEditingMessage(null);
    }
  };

  const handleReply = (msg) => {
    setEditingMessage(null);
    setReplyingTo(msg);
  };

  const handleEdit = (msg) => {
    setReplyingTo(null);
    setEditingMessage(msg);
  };

  const handleDelete = (msg) => {
    deleteMessage(msg.id).catch((err) => console.error("Failed to delete message:", err));
  };

  const handlePin = (msg) => {
    if (pinned?.messageId === msg.id) {
      unpinMessage();
    } else {
      pinMessage(msg);
    }
  };

  const handleConfirmClear = async () => {
    setClearing(true);
    try {
      await clearChat();
      setShowClearConfirm(false);
    } catch (err) {
      console.error("Failed to clear chat:", err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="chat-root bg-background flex flex-col overflow-hidden">
      <ChatHeader
        them={them}
        isOnline={theirOnline}
        onSwitchUser={clearIdentity}
        onLeaveRoom={leaveRoom}
        onStartCall={() => call.startCall("audio")}
        onStartVideoCall={() => call.startCall("video")}
        callDisabled={call.status !== "idle" || status !== "ready"}
        onClearChat={() => setShowClearConfirm(true)}
      />

      <PinnedBanner pinned={pinned} onJump={scrollToMessage} onUnpin={unpinMessage} />

      {status === "error" && (
        <ErrorBanner
          message={error || "Lost connection to the chat. Check your internet."}
        />
      )}

      {call.error && call.status === "idle" && (
        <ErrorBanner message={call.error} />
      )}

      {status === "connecting" ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot [animation-delay:200ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot [animation-delay:400ms]" />
          </div>
        </div>
      ) : (
        <MessageList
          messages={messages}
          myId={me.id}
          themName={them.name}
          themAvatar={them.avatar}
          theirLastSeen={theirLastSeen}
          theirTyping={theirTyping}
          pinnedMessageId={pinned?.messageId}
          onReply={handleReply}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPin={handlePin}
        />
      )}

      <MessageInput
        onSend={handleSend}
        onSendVoice={handleSendVoice}
        onSaveEdit={handleSaveEdit}
        disabled={status === "error"}
        onTyping={setTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />

      <CallOverlay call={call} />

      {showClearConfirm && (
        <ConfirmDialog
          title="Clear this chat?"
          message={`This deletes every message for both you and ${them.name}, permanently. This can't be undone.`}
          confirmLabel="Clear chat"
          danger
          busy={clearing}
          onConfirm={handleConfirmClear}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}