/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#17140f',
        panel: '#1e1a13',
        'panel-2': '#251f16',
        raised: '#2c2419',
        line: '#3a3122',
        'line-soft': '#2a2419',
        foundry: {
          text: '#ece3d2',
          'text-dim': '#a89c85',
          'text-faint': '#736853',
        },
        copper: {
          DEFAULT: '#e0954a',
          hover: '#e8a15c',
          dim: '#7a5227',
          glow: 'rgba(224,149,74,0.16)',
        },
        good: {
          DEFAULT: '#8faa63',
          bg: 'rgba(143,170,99,0.12)',
        },
        warn: {
          DEFAULT: '#d9a441',
          bg: 'rgba(217,164,65,0.12)',
        },
        bad: {
          DEFAULT: '#c15a3f',
          bg: 'rgba(193,90,63,0.12)',
        },
        factorio: {
          bg: '#111215',
          sidebar: '#16181d',
          card: '#1d2027',
          cardHover: '#252932',
          border: '#2c313c',
          borderLight: '#3f4553',
          orange: '#e77c22',
          orangeHover: '#f98c35',
          orangeDark: '#b85c12',
          text: '#e6e8eb',
          textMuted: '#949ba4',
        }
      },
      fontFamily: {
        slab: ['"Zilla Slab"', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
