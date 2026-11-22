/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        termo: {
          bg: '#121213',
          surface: '#18181b',
          correct: '#3aa394',
          present: '#d3ad69',
          absent: '#312a2c',
          empty: '#18181b',
          border: '#3a3a3c',
          key: '#4c4347',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Mitr"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
