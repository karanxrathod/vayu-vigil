/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F6F5C',
          light: '#2B8D76',
          dark: '#144B3E',
          50: '#E8F5F2',
          100: '#CBEBE4'
        },
        critical: {
          DEFAULT: '#D64545',
          light: '#E56868',
          bg: '#FDF2F2'
        },
        moderate: {
          DEFAULT: '#E8A33D',
          light: '#F0B863',
          bg: '#FEF8EE'
        },
        low: {
          DEFAULT: '#4C8C4A',
          light: '#65A963',
          bg: '#F0F9F0'
        },
        neutral: {
          resolved: '#8B94A3',
          bg: '#F7F8FA',
          ink: '#1C1F26'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 111, 92, 0.08)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
