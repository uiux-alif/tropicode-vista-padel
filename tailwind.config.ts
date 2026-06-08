import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#10503a",
          dark: "#08231a",
          light: "#1c6b4c",
          accent: "#c6f135",
          mint: "#e9f8ef",
        },
        peak: "#f9a8d4",
        ink: "#0c1411",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 12px 40px -16px rgba(8, 35, 26, 0.22)",
        card: "0 1px 2px rgba(8,35,26,0.04), 0 8px 30px -18px rgba(8,35,26,0.25)",
        lift: "0 24px 60px -24px rgba(8,35,26,0.35)",
        glow: "0 0 0 1px rgba(198,241,53,0.4), 0 12px 40px -12px rgba(198,241,53,0.45)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(8,35,26,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(8,35,26,0.04) 1px, transparent 1px)",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-slow": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out both",
        "fade-in-slow": "fade-in-slow 0.7s ease-out both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
