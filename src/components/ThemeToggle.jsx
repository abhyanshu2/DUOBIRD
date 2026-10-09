import { HiMoon, HiSun } from "react-icons/hi2";
import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`w-10 h-10 flex items-center justify-center rounded-full bg-card border border-ink/10 text-ink shadow-soft hover:bg-bubble active:scale-95 transition-all ${className}`}
    >
      {isDark ? <HiSun className="text-lg" /> : <HiMoon className="text-lg" />}
    </button>
  );
}
