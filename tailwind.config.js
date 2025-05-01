/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundColor: {
        'dark-primary': '#1a1a1a',
        'dark-secondary': '#2d2d2d',
      },
      textColor: {
        'dark-primary': '#ffffff',
        'dark-secondary': '#a0a0a0',
      },
      typography: {
        DEFAULT: {
          css: {
            table: {
              width: '100%',
              borderCollapse: 'collapse',
            },
            'thead, tbody': {
              borderWidth: '1px',
              borderColor: 'var(--tw-prose-th-borders)',
            },
            'th, td': {
              padding: '0.75rem',
              borderWidth: '1px',
              borderColor: 'var(--tw-prose-td-borders)',
            },
            th: {
              backgroundColor: 'var(--tw-prose-th-bg)',
            },
          },
        },
      },
    },
  },
  // ESLint 규칙을 피하기 위한 다른 방법
  plugins: [import('@tailwindcss/typography')],
}