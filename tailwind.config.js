/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        olive: '#1B382B',
        gold: '#C5A059',
        cream: '#FDFBF7'
      },
      fontFamily: {
        sans: ['Cairo', 'Tahoma', 'sans-serif']
      }
    }
  },
  plugins: []
};
