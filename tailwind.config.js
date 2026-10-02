/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Every colour is a CSS variable (see src/index.css) so the light and
        // dark themes can swap them. `<alpha-value>` keeps ink/10, primary/60...
        background: "rgb(var(--c-background) / <alpha-value>)",
        card: "rgb(var(--c-card) / <alpha-value>)",
        bubble: "rgb(var(--c-bubble) / <alpha-value>)", // the other person's bubble
        primary: "rgb(var(--c-primary) / <alpha-value>)",
        primaryDark: "rgb(var(--c-primary-dark) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)", // online dot, unread badge, answer-call
        ink: "rgb(var(--c-ink) / <alpha-value>)", // main text (also ink/5, ink/10 soft lines)
        muted: "rgb(var(--c-muted) / <alpha-value>)",
      },
      borderRadius: {
        chat: "20px",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glow: "0 0 0 1px rgba(10, 138, 106, 0.18), 0 8px 24px rgba(10, 138, 106, 0.2)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(8px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: 0, transform: "scale(0.92)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.35 },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.28s ease-out",
        "pop-in": "pop-in 0.2s ease-out",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};