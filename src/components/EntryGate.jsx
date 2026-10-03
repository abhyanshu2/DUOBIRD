import { useEffect, useState } from "react";
import {
  HiLockClosed,
  HiArrowRight,
  HiPencil,
  HiCheck,
  HiXMark,
  HiSparkles,
  HiHeart,
} from "react-icons/hi2";
import { USERS, ACCESS_CODE } from "../utils/constants";
import { generateRoomCode, generateRoomPin, buildRoomId } from "../utils/room";
import { useIdentity } from "../context/IdentityContext";
import { useProfileNames, saveProfileName } from "../hooks/useProfileNames";
import ThemeToggle from "./ThemeToggle";

const INPUT_CLASS =
  "mt-2 w-full bg-background border border-ink/10 rounded-xl px-4 py-3 text-ink placeholder:text-muted/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all";

/**
 * One single screen, no steps and no real login:
 *   - Room name + secret PIN: whichever couple knows both lands in the same
 *     private thread, so any number of pairs can share one deployment.
 *   - Who are you: pick a seat for this device (Person A / Person B), and
 *     rename either person with the pencil.
 * Then "Enter room" does it all at once.
 */
export default function EntryGate() {
  const { roomCode, roomPin, joinRoom, setIdentity } = useIdentity();

  // If this device already knows the room (e.g. after "Switch identity"),
  // start with it filled in.
  const [code, setCode] = useState(roomCode || "");
  const [pin, setPin] = useState(roomPin || "");
  const [accessCode, setAccessCode] = useState("");
  const [selected, setSelected] = useState(null);
  const [edits, setEdits] = useState({}); // names changed on this screen
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const codeRequired = Boolean(ACCESS_CODE);
  const accessValid = !codeRequired || accessCode === ACCESS_CODE;
  const roomId = buildRoomId(code, pin);

  // Once a full room name + PIN is typed (and the typing pauses), look up the
  // names people already chose in that room so the tiles show them.
  const [previewId, setPreviewId] = useState(roomId);
  useEffect(() => {
    const t = setTimeout(() => setPreviewId(roomId), 600);
    return () => clearTimeout(t);
  }, [roomId]);
  const { names } = useProfileNames(previewId);

  const nameOf = (id) =>
    (edits[id] && edits[id].trim()) ||
    (names[id] && names[id].trim()) ||
    USERS[id].name;

  const startEditing = (e, userId) => {
    e.stopPropagation();
    setEditingId(userId);
    setDraftName(nameOf(userId));
  };

  const cancelEditing = (e) => {
    e?.stopPropagation();
    setEditingId(null);
    setDraftName("");
  };

  const commitEditing = (e, userId) => {
    e?.stopPropagation();
    const trimmed = draftName.trim();
    if (trimmed) setEdits((prev) => ({ ...prev, [userId]: trimmed }));
    setEditingId(null);
    setDraftName("");
  };

  const handleGenerate = () => {
    setCode(generateRoomCode());
    setPin(generateRoomPin());
  };

  const handleEnter = async () => {
    setTouched(true);
    if (!roomId || !accessValid || !selected || busy) return;
    setBusy(true);

    // A name that is still open in its edit box counts too.
    const finalEdits = { ...edits };
    if (editingId && draftName.trim()) finalEdits[editingId] = draftName.trim();

    // Save renamed people first (best effort: never blocks entering).
    await Promise.all(
      Object.entries(finalEdits).map(([userId, name]) =>
        saveProfileName(roomId, userId, name).catch((err) =>
          console.error("Failed to save name:", err)
        )
      )
    );

    joinRoom(code, pin);
    setIdentity(selected);
    setBusy(false);
  };

  const onEnterKey = (e) => e.key === "Enter" && handleEnter();

  return (
    <div className="app-min-height bg-background relative overflow-hidden flex items-center justify-center px-6 py-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
      <div
        className="absolute right-4 z-10"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-[18px] bg-primary text-white flex items-center justify-center mb-3">
            <HiHeart className="text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Our room</h1>
          <p className="text-muted text-sm mt-1">
            A private space for just the two of you.
          </p>
        </div>

        {/* Room name + PIN */}
        <div className="bg-card rounded-chat p-5 shadow-soft border border-ink/10">
          <label className="text-xs font-medium text-muted">Room name</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={onEnterKey}
            placeholder="e.g. hamara-pyaar"
            autoFocus
            className={INPUT_CLASS}
          />

          <label className="text-xs font-medium text-muted block mt-4">
            Secret PIN
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={onEnterKey}
            placeholder="e.g. 4821"
            className={INPUT_CLASS}
          />
          <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
            Only you and your partner should know this. The room name alone
            isn't private, someone else could type the same name by
            coincidence, but they won't also guess your PIN.
          </p>

          <button
            onClick={handleGenerate}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <HiSparkles className="text-sm" />
            Starting fresh? Generate both for us
          </button>

          {codeRequired && (
            <div className="mt-4">
              <label className="text-xs font-medium text-muted">
                Access code
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                onKeyDown={onEnterKey}
                placeholder="This app's shared password"
                className={INPUT_CLASS}
              />
            </div>
          )}
        </div>

        {/* Who are you */}
        <p className="text-xs font-medium text-muted mt-5 mb-2 px-1">
          Who are you?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(USERS).map((user) => {
            const isActive = selected === user.id;
            const isEditing = editingId === user.id;
            const name = nameOf(user.id);

            return (
              <div
                key={user.id}
                onClick={() => !isEditing && setSelected(user.id)}
                role="button"
                tabIndex={0}
                className={`relative flex flex-col items-center gap-2 rounded-2xl py-4 px-2 border transition-all duration-200 cursor-pointer bg-card ${
                  isActive
                    ? "border-primary ring-1 ring-primary shadow-glow"
                    : "border-ink/10 hover:bg-bubble"
                }`}
              >
                {!isEditing && (
                  <button
                    onClick={(e) => startEditing(e, user.id)}
                    aria-label={`Rename ${name}`}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-ink/10 transition-colors"
                  >
                    <HiPencil className="text-xs" />
                  </button>
                )}

                <span
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-base shrink-0 text-white transition-colors ${
                    isActive ? "bg-primary" : "bg-primary/50"
                  }`}
                >
                  {user.avatar}
                </span>

                {isEditing ? (
                  <div
                    className="flex flex-col items-center gap-2 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEditing(e, user.id);
                        if (e.key === "Escape") cancelEditing(e);
                      }}
                      maxLength={30}
                      placeholder="Your name"
                      className="w-full min-w-0 bg-ink/10 border border-primary/50 rounded-lg px-2.5 py-1.5 text-base text-ink text-center outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => commitEditing(e, user.id)}
                        aria-label="Save name"
                        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-accent text-white"
                      >
                        <HiCheck className="text-sm" />
                      </button>
                      <button
                        onClick={cancelEditing}
                        aria-label="Cancel"
                        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-ink/10"
                      >
                        <HiXMark className="text-sm" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span
                    className={`text-sm font-medium truncate max-w-full ${
                      isActive ? "text-ink" : "text-muted"
                    }`}
                  >
                    {name}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {touched && (!roomId || !selected || !accessValid) && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-3 px-1">
            {!roomId
              ? "Fill in both the room name and the PIN."
              : !accessValid
              ? "That access code doesn't match."
              : "Pick Person A or Person B."}
          </p>
        )}

        <button
          onClick={handleEnter}
          disabled={busy}
          className="mt-5 w-full flex items-center justify-center gap-2 bg-primary disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
        >
          Enter room
          <HiArrowRight />
        </button>

        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary mt-5">
          <HiLockClosed className="text-sm" />
          Only people with this room name and PIN can join
        </p>
        <p className="text-center text-xs text-muted mt-2 leading-relaxed">
          Share the room name and PIN with your partner. This device will
          remember you, so there's no signup ever. Tap the pencil on a tile
          any time to change a name.
        </p>
      </div>
    </div>
  );
}