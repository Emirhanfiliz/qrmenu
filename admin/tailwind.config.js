/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c0c0c',
        surface: '#1a1a1a',
        border: '#2e2e2e',
        emerge: '#10b981',
        danger: '#ef4444',
        warn: '#f59e0b',
        dim: '#6b7280',
        bright: '#f3f4f6',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
