/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",        // include app directory
    "./pages/**/*.{js,ts,jsx,tsx}",      // include pages directory
    "./components/**/*.{js,ts,jsx,tsx}", // include components
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
