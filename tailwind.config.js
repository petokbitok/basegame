/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          blue: '#0052FF',
          'blue-dark': '#0041CC',
          'blue-light': '#0066FF',
        },
        poker: {
          green: '#0a5f38',
          'green-dark': '#064429',
          felt: '#1a7a4a',
        },
        card: {
          red: '#dc2626',
          black: '#1f2937',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        mono: ['Monaco', 'Courier New', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'deal-card': 'dealCard 0.3s ease-out',
        'chip-move': 'chipMove 0.5s ease-in-out',
        'winner-pulse': 'pulse 1s ease-in-out infinite',
      },
      keyframes: {
        dealCard: {
          '0%': { transform: 'translateY(-100px) scale(0.5)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        chipMove: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
