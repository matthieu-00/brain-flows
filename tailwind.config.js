/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFCF8',  // Primary background
          100: '#FAF7F0', // Secondary background
        },
        sage: {
          900: '#2D5A3D', // Primary green
          700: '#4A7C59', // Hover states
          100: '#E8F5E8', // Light green highlights
          200: '#C8E6C9', // Form focus, call-outs
        },
        neutral: {
          900: '#2C2C2C', // Primary text
          600: '#6B7280', // Secondary text
          300: '#E5E7EB', // Borders, dividers
          100: '#F3F4F6', // Subtle backgrounds
        }
      }
    },
  },
  plugins: [],
};
