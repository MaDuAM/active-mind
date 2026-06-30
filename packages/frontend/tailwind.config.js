// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fef9e7',
          100: '#fdebd0',
          200: '#fad7a0',
          300: '#f8c471',
          400: '#f5b041',
          500: '#B8860B',
          600: '#DAA520',
          700: '#996515',
          800: '#8b7222',
          900: '#6e5a1a',
        },
        error: {
          DEFAULT: '#dc2626',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      borderRadius: {
        'button': '0.375rem',
        'card': '0.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(var(--shadow-color), var(--shadow-opacity))',
        'dropdown': '0 4px 12px rgba(var(--shadow-color), 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    
  ],
}