import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "960px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        bg: "#f0e6d8",
        surface: "#fffdf8",
        table: { DEFAULT: "#5c3d2e", hi: "#7a5542", lo: "#3d2518" },
        board: { DEFAULT: "#f5ede0", rim: "#8b7355", deep: "#6b5940" },
        c: {
          brown: "#8B4513",
          sky: "#87CEEB",
          pink: "#FF69B4",
          orange: "#FF8C42",
          red: "#E74C3C",
          yellow: "#F1C40F",
          green: "#2ECC71",
          navy: "#2C3E80",
          purple: "#8E44AD",
          gold: "#DAA520",
        },
        accent: { DEFAULT: "#ff8c42", d: "#e07030" },
        mint: "#3ecfcf",
        coin: { DEFAULT: "#ffd93d", d: "#e6b800" },
        txt: { DEFAULT: "#2d2b55", 2: "#5a5780", 3: "#9490b0" },
      },
      fontFamily: {
        title: ["'ZCOOL KuaiLe'", "sans-serif"],
        body: ["'Noto Sans SC'", "sans-serif"],
        num: ["'Fredoka'", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 0 rgba(0,0,0,.05), 0 6px 16px rgba(0,0,0,.06)",
        "card-press": "0 2px 0 rgba(0,0,0,.05), 0 3px 8px rgba(0,0,0,.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
