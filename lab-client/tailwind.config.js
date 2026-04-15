/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4f8ef7',
          dark: '#3a7ae0',
          light: '#7aaeff',
          50: '#eff6ff',
        },
        surface: {
          DEFAULT: '#0e1117',
          card: '#161c27',
          raised: '#1c2333',
          border: '#1e2a3a',
          muted: '#7a8fa6',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Fira Code"', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        glow: '0 0 20px rgba(79,142,247,0.25)',
      },
    },
  },
  plugins: [],
}

