/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FEFCF8',
          100: '#FAF7F0',
          '200-dark': '#3A3225',
        },
        sage: {
          900: '#2D5A3D',
          700: '#4A7C59',
          600: '#3D7A52',
          500: '#4E8C63',
          400: '#76B892',
          100: '#E8F5E8',
          200: '#C8E6C9',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#6B7280',
          900: '#2C2C2C',
          950: '#050608',
          800: '#151A1F',
          700: '#232A32',
          surface: '#0B0E10',
          text: '#F5F5F6',
          textMuted: '#C3C7CF',
        },
        /* Semantic aliases from CSS custom properties */
        surface: {
          primary: 'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          DEFAULT: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-elevated)',
          input: 'var(--color-bg-input)',
          hover: 'var(--color-bg-hover)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        edge: {
          DEFAULT: 'var(--color-border-default)',
          subtle: 'var(--color-border-subtle)',
          focus: 'var(--color-border-focus)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          subtle: 'var(--color-accent-subtle)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          subtle: 'var(--color-danger-subtle)',
        },
      },
      boxShadow: {
        'token-sm': 'var(--shadow-sm)',
        'token-md': 'var(--shadow-md)',
        'token-lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        'token-sm': 'var(--radius-sm)',
        'token-md': 'var(--radius-md)',
        'token-lg': 'var(--radius-lg)',
        'token-xl': 'var(--radius-xl)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        default: 'var(--easing-default)',
      },
    },
  },
  plugins: [],
};
