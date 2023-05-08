const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "src/**/*.{ts,tsx}", 
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        "primary": "#11132b",
        "gold": "#ffd700",
        "silver": "#C0c0c0",
        "bronze": "#Cd7f32",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}