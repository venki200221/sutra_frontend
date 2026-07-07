/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette from the brief: white base, faded violet accent, soft grays.
        ink: '#1D1B26',      // headlines
        body: '#6B6B76',     // body text (AA on white)
        line: '#E8E6EF',     // dividers / card borders
        tint: '#FAF9FD',     // faint section tint
        violet: {
          50: '#F6F3FD',
          100: '#EFE9FA',
          200: '#DCD2F2',
          300: '#C9B8ED',    // faded accent (decorative)
          400: '#B7A6E0',    // faded accent (path lines, chips)
          500: '#8E7CC3',    // emphasis — large text / icons only
          600: '#7A67B8',    // deep enough for small text + button bg (AA)
          700: '#5F4E9E',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 60px -24px rgba(142, 124, 195, 0.28), 0 2px 8px -2px rgba(29, 27, 38, 0.06)',
        button: '0 10px 30px -10px rgba(122, 103, 184, 0.55)',
      },
      maxWidth: {
        panel: '26.5rem',
      },
    },
  },
  plugins: [],
}
