/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void:       '#f3f4f6',   // ana arka plan (çok açık gri)
        surface:    '#ffffff',   // kart / header
        elevated:   '#f9fafb',   // hover, input bg
        border:     '#e5e7eb',   // border
        gold:       '#6366f1',   // indigo primary
        'gold-dim': '#4f46e5',   // indigo hover
        silver:     '#6b7280',   // muted text
        snow:       '#111827',   // ana metin
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
