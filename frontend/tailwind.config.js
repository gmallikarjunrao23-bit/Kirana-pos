/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#16a34a',
        'primary-dark': '#15803d',
        'primary-light': '#dcfce7',
        accent: '#f59e0b',
        danger: '#ef4444',
        surface: '#f9fafb',
        card: '#ffffff',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease forwards',
        'fade-in': 'fadeIn 0.2s ease forwards',
        'pulse-ring': 'pulseRing 1.5s infinite',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(22,163,74,0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(22,163,74,0)' },
        },
      },
    },
  },
  plugins: [],
}
