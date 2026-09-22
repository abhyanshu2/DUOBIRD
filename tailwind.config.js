/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0F0B1A",
        card: "#1E1830",
        primary: "#8B5CF6",
        primaryDark: "#6D28D9",
        accent: "#22C55E",
        ink: "#FFFFFF",
        muted: "#9E96B5",
      },
      borderRadius: {
        chat: "20px",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0, 0, 0, 0.3)",
        glow: "0 0 0 1px rgba(139, 92, 246, 0.18), 0 8px 24px rgba(139, 92, 246, 0.18)",
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
