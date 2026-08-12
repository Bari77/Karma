/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        karma: {
          bg: "#0a0a12",
          card: "#12121f",
          glow: "var(--theme-glow)",
          good: "var(--theme-good)",
          bad: "var(--theme-bad)",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px var(--theme-shadow-to)" },
          "50%": {
            boxShadow:
              "0 0 40px var(--theme-shadow-to-strong), 0 0 60px var(--theme-shadow-from)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
