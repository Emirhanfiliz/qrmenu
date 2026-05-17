/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0a',
        surface: '#141414',
        elevated: '#1f1f1f',
        border: '#2a2a2a',
        gold: '#f0a500',
        'gold-dim': '#c4880a',
        silver: '#a0a0a0',
        snow: '#f0f0f0',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
