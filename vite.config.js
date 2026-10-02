import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from a sub-folder (/DUOBIRD/); Netlify, Vercel
  // and local dev serve it from the root (/). GitHub Actions sets
  // GITHUB_ACTIONS automatically, so one codebase works on both.
  base: process.env.GITHUB_ACTIONS ? "/DUOBIRD/" : "/",
  server: {
    port: 5173,
  },
});