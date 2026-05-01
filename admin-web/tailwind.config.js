/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6F00',
          hover: '#E65100',
        },
        secondary: '#FF9933',
      }
    },
  },
  plugins: [],
}
