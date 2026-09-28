/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f5',
          100: '#fce7e9',
          200: '#fad3d7',
          300: '#f6b2b9',
          400: '#ef828e',
          500: '#e35364',
          600: '#ce3749',
          700: '#ad2938',
          800: '#902532',
          900: '#79242e',
        },
        boba: {
          matcha: '#4ade80',
          orange: '#fb923c',
          strawberry: '#f43f5e',
          blueberry: '#6366f1',
          taro: '#a855f7',
          pearl: '#1e1b4b',
        },
        momo: {
          amber: '#f59e0b',
          chili: '#dc2626',
          dough: '#fef3c7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
