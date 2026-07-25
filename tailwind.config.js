/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B1523',
          soft: '#251C2E',
          softer: '#2E2438',
          line: '#3A2E46'
        },
        candle: {
          DEFAULT: '#E8B04B',
          dim: '#B8853A',
          glow: '#F5C86B'
        },
        dusk: {
          DEFAULT: '#7C8FE0',
          soft: '#9AA8E8'
        },
        parchment: {
          DEFAULT: '#F2EAF5',
          muted: '#C9BFE0',
          dim: '#8A7A9A'
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Karla"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        note: '0 18px 40px -18px rgba(0,0,0,0.55)',
        glow: '0 0 24px rgba(232, 176, 75, 0.35)'
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '25%': { opacity: 0.85, transform: 'scale(0.97)' },
          '50%': { opacity: 1, transform: 'scale(1.03)' },
          '75%': { opacity: 0.9, transform: 'scale(0.99)' }
        },
        rise: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        flicker: 'flicker 2.4s ease-in-out infinite',
        rise: 'rise 0.5s ease-out both'
      }
    }
  },
  plugins: []
}
