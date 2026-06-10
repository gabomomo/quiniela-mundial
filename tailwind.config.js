/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fifa: {
          blue: '#003DA5',
          red: '#DA291C',
          gold: '#FFD700',
          dark: '#0A1628',
        }
      },
    },
  },
  plugins: [],
}

