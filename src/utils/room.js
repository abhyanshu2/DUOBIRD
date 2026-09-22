/**
 * Turns whatever a person typed ("Hamara Pyaar!!", "  Rahul&Priya  ") into
 * a safe, consistent Firestore path segment. This is what actually
 * isolates one couple's room from every other couple using the same
 * deployment — two people only ever land in the same room if they type
 * the same code, which is exactly the point.
 */
export function slugifyRoomCode(raw) {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
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
