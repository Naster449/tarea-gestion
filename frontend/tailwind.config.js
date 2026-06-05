/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
        accent: {
          cyan: "#22d3ee",
          green: "#34d399",
        },
      },
      boxShadow: {
        glow: "0 0 30px rgba(139, 92, 246, 0.35)",
        "glow-cyan": "0 0 20px rgba(34, 211, 238, 0.4)",
      },
      animation: {
        scan: "scan 2.5s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%, 100%": { top: "15%" },
          "50%": { top: "75%" },
        },
      },
    },
  },
  plugins: [],
};
