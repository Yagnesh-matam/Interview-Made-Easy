/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        appBg: '#0b0f19',      // Dark slate cyber backdrop
        appCard: '#111625',    // Secondary card surfaces
        appBorder: '#1e293b',  // Clean grid borders
        appCyan: '#00F5D4',    // High-visibility accent cyan
        appGold: '#CA8A04',    // Technical mastery amber gold
      },
    },
  },
  plugins: [],
}