import { useState } from "react";
import {
  HiLockClosed,
  HiArrowRight,
  HiArrowLeft,
  HiPencil,
  HiCheck,
  HiXMark,
  HiSparkles,
} from "react-icons/hi2";
import { USERS, ACCESS_CODE } from "../utils/constants";
import { generateRoomCode, slugifyRoomCode } from "../utils/room";
import { useIdentity } from "../context/IdentityContext";

/**
 * Two steps, neither of them a real login:
 *   1. Room Code — whichever couple knows this code lands in the same
 *      private thread. This is what lets any number of pairs share one
 *      deployment of the app without ever seeing each other's messages.
 *   2. Who's this — same as before, pick a seat for this device, with
 *      an optional rename right here.
 */
export default function EntryGate() {
  const { roomId, joinRoom, leaveRoom, setIdentity, displayName, updateName } =
    useIdentity();

  if (!roomId) {
    return <RoomStep onJoin={joinRoom} />;
  }

  return (
    <IdentityStep
      onBack={leaveRoom}
      onEnter={setIdentity}
      displayName={displayName}
      updateName={updateName}
    />
  );
}

function RoomStep({ onJoin }) {
  const [code, setCode] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [touched, setTouched] = useState(false);

  const codeRequired = Boolean(ACCESS_CODE);
  const accessValid = !codeRequired || accessCode === ACCESS_CODE;
  const slug = slugifyRoomCode(code);
  const canContinue = Boolean(slug) && accessValid;

  const handleContinue = () => {
    setTouched(true);
    if (!canContinue) return;
    onJoin(code);
  };

  const handleGenerate = () => setCode(generateRoomCode());

  return (
    <div className="app-min-height bg-background flex items-center justify-center px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
            <HiLockClosed className="text-primary text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Duo</h1>
          <p className="text-muted text-sm mt-1">
            A private room built for exactly two people.
          </p>
        </div>

        <div className="bg-card rounded-chat p-5 shadow-soft border border-white/5">
          <label className="text-xs uppercase tracking-wider text-muted font-semibold">
            Your room code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            placeholder="e.g. hamara-pyaar"
            autoFocus
            className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-ink placeholder:text-muted/70 outline-none focus:border-primary transition-colors"
          />
          {touched && !slug && (
            <p className="text-xs text-red-400 mt-1.5">Type a code first.</p>
          )}

          <button
            onClick={handleGenerate}
            className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:brightness-125 transition-all"
          >
            <HiSparkles className="text-sm" />
            Starting fresh? Generate a new code
          </button>

          {codeRequired && (
            <div className="mt-4">
              <label className="text-xs uppercase tracking-wider text-muted font-semibold">
                Access code
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                placeholder="This app's shared password"
                className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-ink placeholder:text-muted/70 outline-none focus:border-primary transition-colors"
              />
              {touched && !accessValid && (
                <p className="text-xs text-red-400 mt-1.5">
                  That access code doesn't match.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!slug}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-primary disabled:bg-white/10 disabled:text-muted disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            Continue
            <HiArrowRight />
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-5">
          Share this exact code with your partner — whoever types it lands
          in the same private room as you. Anyone with a different code
          gets a completely separate, private conversation.
        </p>
      </div>
    </div>
  );
}

function IdentityStep({ onBack, onEnter, displayName, updateName }) {
  const [selected, setSelected] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = (e, userId) => {
    e.stopPropagation();
    setEditingId(userId);
    setDraftName(displayName(userId));
  };

  const cancelEditing = (e) => {
    e?.stopPropagation();
    setEditingId(null);
    setDraftName("");
  };

  const saveEditing = async (e, userId) => {
    e?.stopPropagation();
    const trimmed = draftName.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }
    setSaving(true);
    try {
      await updateName(userId, trimmed);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to save name:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-min-height bg-background flex items-center justify-center px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm animate-fade-in-up">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-6"
        >
          <HiArrowLeft className="text-sm" />
          Use a different room
        </button>

        <div className="bg-card rounded-chat p-5 shadow-soft border border-white/5">
          <p className="text-xs uppercase tracking-wider text-muted mb-3 font-semibold">
            Who's this?
          </p>
          <div className="grid grid-cols-2 gap-3 mb-1">
            {Object.values(USERS).map((user) => {
              const isActive = selected === user.id;
              const isEditing = editingId === user.id;
              const name = displayName(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => !isEditing && setSelected(user.id)}
                  role="button"
                  tabIndex={0}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl py-4 px-2 border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {!isEditing && (
                    <button
                      onClick={(e) => startEditing(e, user.id)}
                      aria-label={`Rename ${name}`}
                      className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-white/10 transition-colors"
                    >
                      <HiPencil className="text-xs" />
                    </button>
                  )}

                  <span
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-base shrink-0 ${
                      isActive ? "bg-primary text-white" : "bg-white/10 text-ink"
                    }`}
                  >
                    {user.avatar}
                  </span>

                  {isEditing ? (
                    <div
                      className="flex items-center gap-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        autoFocus
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing(e, user.id);
                          if (e.key === "Escape") cancelEditing(e);
                        }}
                        maxLength={30}
                        placeholder="Your name"
                        className="min-w-0 flex-1 bg-white/10 border border-primary/50 rounded-lg px-2 py-1 text-sm text-ink outline-none"
                      />
                      <button
                        onClick={(e) => saveEditing(e, user.id)}
                        disabled={saving}
                        aria-label="Save name"
                        className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-accent text-white disabled:opacity-50"
                      >
                        <HiCheck className="text-xs" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        aria-label="Cancel"
                        className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-white/10"
                      >
                        <HiXMark className="text-xs" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-ink font-medium truncate max-w-full">
                      {name}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => selected && onEnter(selected)}
            disabled={!selected}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary disabled:bg-white/10 disabled:text-muted disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            Enter chat
            <HiArrowRight />
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-5">
          This device will remember you. No signup, ever. Tap the pencil on
          your tile any time to change your name.
        </p>
      </div>
    </div>
  );
}
