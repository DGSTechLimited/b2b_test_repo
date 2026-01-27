import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      },
      colors: {
        brand: {
          950: "#1E293B",
          900: "#334155",
          800: "#475569",
          700: "#64748B",
          600: "#94A3B8"
        },
        accent: {
          600: "#0B4395",
          500: "#0F56B8",
          400: "#3D7BD9"
        },
        navy: {
          900: "#1B2A44",
          800: "#24385A",
          700: "#2E456B"
        },
        surface: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1"
        },
        status: {
          success: "#15803D",
          warning: "#B45309",
          error: "#B91C1C"
        }
      },
      backgroundImage: {
        page: "radial-gradient(circle at top left, rgba(30,41,59,0.06), transparent 50%), radial-gradient(circle at 20% 80%, rgba(11,67,149,0.06), transparent 55%), linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)",
        header: "linear-gradient(135deg, #1B2A44 0%, #223557 60%, #2C4468 100%)"
      },
      boxShadow: {
        soft: "0 18px 40px -30px rgba(15,23,42,0.22)",
        card: "0 14px 32px -24px rgba(15,23,42,0.25)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("tailwindcss-animate")]
};

export default config;
