import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system SOMMA — laranja dominante
        primary: {
          DEFAULT: "#FF2C03",
          hover: "#FB4C00",
          soft: "rgba(255,44,3,0.1)",
        },
        strava: "#FC4C02",
        ink: "#0A0A0A",
        muted: "#737373",
        dark: {
          bg: "#000000",
          card: "#0E0E0E",
        },
        light: "#F5F5F5",
        // Acento Na Praia Festival (creme/areia do selo)
        sand: {
          DEFAULT: "#FDF1E0",
          deep: "#F5E4CC",
        },
        // Collab: azul profundo do hero + creme das seções claras + amarelo da R2
        navy: {
          DEFAULT: "#010775",
          deep: "#01053F",
          soft: "#0A1090",
        },
        cream: "#FEF5E6",
        r2: "#FCAD00",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      maxWidth: {
        container: "1200px",
      },
      borderRadius: {
        card: "16px",
        panel: "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.05)",
        lift: "0 12px 40px -12px rgba(0,0,0,0.25)",
      },
      spacing: {
        section: "112px",
      },
      letterSpacing: {
        display: "-0.025em",
        wordmark: "-0.05em",
      },
      keyframes: {
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "spin-slow": "spinSlow 40s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
