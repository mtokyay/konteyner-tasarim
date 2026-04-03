/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#fef5e7',
          100: '#fde6b0',
          200: '#fdd779',
          300: '#fcc842',
          400: '#fbb904',
          500: '#e5a803',
          600: '#c99502',
          700: '#a67d02',
          800: '#846502',
          900: '#624d01',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
