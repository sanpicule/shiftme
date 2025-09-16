/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          white: 'rgba(255, 255, 255, 0.25)',
          'white-strong': 'rgba(255, 255, 255, 0.4)',
          'white-weak': 'rgba(255, 255, 255, 0.1)',
          black: 'rgba(0, 0, 0, 0.25)',
          'black-strong': 'rgba(0, 0, 0, 0.4)',
          'black-weak': 'rgba(0, 0, 0, 0.1)',
        },
        backdrop: {
          blur: 'rgba(255, 255, 255, 0.1)',
          'blur-dark': 'rgba(0, 0, 0, 0.1)',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        glassShine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        glassShine: 'glassShine 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass-glow': '0 0 20px rgba(156, 163, 175, 0.3)',
      }
    },
  },
  plugins: [],
};
