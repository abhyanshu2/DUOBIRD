/**
 * Turns whatever a person typed ("Hamara Pyaar!!", "  Rahul&Priya  ") into
 * a safe, consistent Firestore path segment.
 */
export function slugifyRoomCode(raw) {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * The actual Firestore path is derived from BOTH the room name and a
 * secret PIN, combined. This matters: a room *name* like "anshu" isn't
 * secret — two totally different couples could easily type the same
 * name. Folding in a PIN that only the two of them know means two
 * different couples never land in the same thread even if they happen
 * to pick the same name.
 */
export function buildRoomId(code, pin) {
  const codeSlug = slugifyRoomCode(code);
  const pinSlug = slugifyRoomCode(pin);
  if (!codeSlug || !pinSlug) return null;
  return `${codeSlug}--${pinSlug}`;
}

const WORDS = [
  "amber", "aurora", "birch", "cedar", "comet", "coral", "dawn", "dune",
  "ember", "fable", "fern", "flint", "glade", "haven", "indigo", "ivy",
  "jasper", "lark", "lumen", "maple", "meadow", "nova", "opal", "orchid",
  "petal", "quartz", "raven", "reef", "sable", "sage", "sol", "willow",
];

/**
 * Suggests a fresh, easy-to-say room code for a couple starting a new
 * room (e.g. "willow-482"), so nobody has to invent a password from
 * scratch. They can still type their own instead.
 */
export function generateRoomCode() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${word}-${number}`;
}

/** Suggests a fresh 4-digit PIN for a couple starting a new room. */
export function generateRoomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}