/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFCF8',   // Primary background (light)
          100: '#FAF7F0',  // Secondary background (light)
          '200-dark': '#3A3225', // Dark mode highlights
        },
        sage: {
          900: '#2D5A3D',  // Primary button (light)
          700: '#4A7C59',  // Button hover (light)
          600: '#3D7A52',  // Primary button (dark)
          500: '#4E8C63',  // Button hover (dark)
          400: '#76B892',  // Accent / links (dark)
          100: '#E8F5E8',  // Highlights (light)
          200: '#C8E6C9',  // Form focus (light)
        },
        neutral: {
          // Light mode
          50: '#FAFAFA',
          100: '#F5F5F6',  // Subtle backgrounds (light) / Primary text (dark)
          200: '#E5E7EB',
          300: '#D1D5DB',  // Borders (light)
          400: '#9CA3AF',
          500: '#6B7280',  // Secondary text (light)
          600: '#6B7280',
          900: '#2C2C2C',  // Primary text (light)
          // Dark mode
          950: '#050608',  // Main bg
          800: '#151A1F',  // Inputs / hover
          700: '#232A32',  // Borders
          // Dark mode surfaces & text (separate to avoid light-mode conflict)
          surface: '#0B0E10',   // dark:bg-neutral-surface
          text: '#F5F5F6',      // dark:text-neutral-text
          textMuted: '#C3C7CF', // dark:text-neutral-textMuted
        }
      }
    },
  },
  plugins: [],
};
