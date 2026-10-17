/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        wellfleet: {
          accent: '#FF385C',
          accentLight: '#FFE8EC',
          accentHover: '#E0264A',
          ink: '#0F172A',
          subtle: '#64748B',
          paper: '#FFFFFF',
          mute: '#F1F5F9',
          border: '#E2E8F0',
          bubble: '#F1F5F9',
          bubbleMe: '#FF385C',
          gold: '#F59E0B',
          online: '#10B981',
          maroon: '#7B1113', // UP Maroon
          crimson: '#800000', // PUP Crimson
          pnuBlue: '#1E40AF', // PNU Blue
        },
        brand: {
          50: '#FFF1F3',
          100: '#FFE4E8',
          200: '#FECDD6',
          300: '#FDA4B5',
          400: '#FB718F',
          500: '#FF385C',
          600: '#E0264A',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        slab: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        phone: '0 25px 70px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)',
        card: '0 20px 30px -10px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0,0,0,0.04)',
        glow: '0 10px 30px -5px rgba(255, 56, 92, 0.35)',
        spark: '0 10px 25px -5px rgba(245, 158, 11, 0.35)',
        soft: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.04)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
