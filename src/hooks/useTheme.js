import { useSyncExternalStore } from "react";

const STORAGE_KEY = "duo-theme";
const BROWSER_BAR_COLOR = { light: "#F6FBF9", dark: "#1B1D1E" };

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // storage blocked (private mode) - fall through to the default
  }
  return "light";
}

function paint(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", BROWSER_BAR_COLOR[theme]);
}

// One shared value, so the toggle on the room screen and the one in the chat
// menu can never disagree.
let current = readSaved();
paint(current);
const listeners = new Set();

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => current;

function setTheme(next) {
  if (next === current) return;
  current = next;
  paint(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore - the theme still changes for this session
  }
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    theme,
    isDark: theme === "dark",
    toggleTheme: () => setTheme(current === "dark" ? "light" : "dark"),
  };
}