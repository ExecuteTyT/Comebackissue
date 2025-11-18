/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./offer.html",
    "./privacy.html",
    "./terms.html",
    "./src/**/*.{js,html}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A8A',
        secondary: '#F97316',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        textDark: '#111827',
        'blue-primary': '#1E3A8A',
        'blue-light': '#3B82F6',
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

