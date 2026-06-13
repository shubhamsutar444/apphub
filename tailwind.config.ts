import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand Colors ──────────────────────────────
        // Primary: Kiwi #89E900 — neon electric green
        primary: {
          DEFAULT: "#89E900",
          50:  "#F4FFD6",
          100: "#E6FFAD",
          200: "#CBFF5C",
          300: "#B0F020",
          400: "#89E900",   // ← core brand
          500: "#72C700",
          600: "#5CA500",
          700: "#468300",
          800: "#306100",
          900: "#1A3F00",
          950: "#0D2000",
        },
        // Background: Night #222222 — near-black charcoal
        night: {
          DEFAULT: "#222222",
          50:  "#F5F5F5",
          100: "#E8E8E8",
          200: "#D0D0D0",
          300: "#B0B0B0",
          400: "#888888",
          500: "#666666",
          600: "#444444",
          700: "#333333",
          800: "#222222",   // ← core dark bg
          900: "#181818",
          950: "#0E0E0E",
        },
        // Alias "secondary" to night so all existing code keeps working
        secondary: {
          DEFAULT: "#222222",
          50:  "#F5F5F5",
          100: "#E8E8E8",
          200: "#D0D0D0",
          300: "#B0B0B0",
          400: "#888888",
          500: "#666666",
          600: "#444444",
          700: "#333333",
          800: "#2A2A2A",
          900: "#222222",
          950: "#141414",
        },
        // Accent: bright lime-white for hover highlights
        accent: {
          DEFAULT: "#BEFF4E",
          50:  "#F8FFE5",
          100: "#EEFFBE",
          200: "#DEFF8A",
          300: "#BEFF4E",
          400: "#A8F000",
          500: "#89E900",
          600: "#6CC200",
          700: "#509B00",
          800: "#347400",
          900: "#1C4D00",
        },
        surface: {
          DEFAULT: "rgba(34, 34, 34, 0.85)",
          light: "rgba(255, 255, 255, 0.06)",
          border: "rgba(137, 233, 0, 0.12)",
        },
      },
      // ── Typography ──────────────────────────────────
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "system-ui", "sans-serif"],
        body:    ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        sans:    ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },
      // ── Gradients ──────────────────────────────────
      backgroundImage: {
        "gradient-dark":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(137,233,0,0.18), transparent 60%), " +
          "radial-gradient(ellipse 50% 40% at 90% 10%, rgba(190,255,78,0.08), transparent 50%), " +
          "linear-gradient(to bottom, #0E0E0E, #181818, #0E0E0E)",
        "gradient-light":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(137,233,0,0.10), transparent 60%), " +
          "linear-gradient(to bottom, #F5F5F5, #EBEBEB, #F5F5F5)",
        "hero-glow":
          "radial-gradient(circle at 50% 50%, rgba(137,233,0,0.15) 0%, transparent 55%)",
        "kiwi-glow":
          "radial-gradient(circle at 50% 0%, rgba(137,233,0,0.25) 0%, transparent 60%)",
      },
      // ── Shadows ──────────────────────────────────
      boxShadow: {
        glass:       "0 8px 32px rgba(0,0,0,0.40)",
        "glass-lg":  "0 16px 48px rgba(0,0,0,0.55)",
        glow:        "0 0 32px rgba(137,233,0,0.30)",
        "glow-lg":   "0 0 60px rgba(137,233,0,0.20)",
        "glow-accent":"0 0 32px rgba(190,255,78,0.25)",
        card:        "0 4px 24px rgba(0,0,0,0.30)",
        "card-hover":"0 12px 40px rgba(137,233,0,0.18)",
        "inner-glow":"inset 0 0 20px rgba(137,233,0,0.08)",
      },
      // ── Border Radius ──────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      // ── Animations ──────────────────────────────────
      animation: {
        float:           "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "pulse-soft":    "pulse-soft 3s ease-in-out infinite",
        shimmer:         "shimmer 2s linear infinite",
        "glow-pulse":    "glow-pulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-14px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.65" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(137,233,0,0.20)" },
          "50%":      { boxShadow: "0 0 40px rgba(137,233,0,0.45)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
