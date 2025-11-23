/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Mapping user's CSS variables to Tailwind colors
        dark: {
          950: '#181818', // --cor-fundo-principal
          900: '#2C2F33', // --cor-card-fundo
          800: '#3C3F43', // --cor-hover-menu
          700: '#444444', // --cor-borda-fina
          600: '#4D4D4D', // status-andamento background
          500: '#606060', // status-aprovacao background
          400: '#A0A0A0', // --cor-texto-secundario
          300: '#BBBBBB', // --cor-destaque
          200: '#FFFFFF', // --cor-texto-principal
        },
        primary: {
          500: '#BBBBBB', // Using --cor-destaque as primary action color
          600: '#A0A0A0', // Hover state
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px', // --tamanho-borda-radius
        'lg': '8px',
        'xl': '8px',
        '2xl': '8px',
      },
      backgroundColor: {
        'app': '#181818',
        'surface': '#2C2F33',
        'surface-hover': '#3C3F43',
      },
      borderColor: {
        'default': '#444444',
      }
    },
  },
  plugins: [],
}
