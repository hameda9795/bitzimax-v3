/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff9f',
        'hot-pink': '#ff0080',
        'electric-blue': '#00e1ff',
        'deep-purple': '#0a0014',
        'cyber-black': '#050008',
      },
      fontFamily: {
        'cyber': ['Share Tech Mono', 'monospace'],
      },
      boxShadow: {
        'neon-green': '0 0 5px #00ff9f, 0 0 10px #00ff9f',
        'hot-pink': '0 0 5px #ff0080, 0 0 10px #ff0080',
        'electric-blue': '0 0 5px #00e1ff, 0 0 10px #00e1ff',
      }
    },
  },
  plugins: [],
}