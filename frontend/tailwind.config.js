/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D9CDB',
        secondary: '#1A2A3A',
        accent: '#F2994A',
        success: '#27AE60',
        danger: '#EB5757',
        warning: '#F2C94C',
        background: '#F7FAFC',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.05)',
        'medium': '0 8px 30px rgba(0,0,0,0.08)',
        'large': '0 20px 60px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}