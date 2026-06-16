/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0d16',
        cardBackground: 'rgba(17, 22, 37, 0.65)',
        borderLight: 'rgba(255, 255, 255, 0.08)',
        accentPurple: '#a855f7',
        accentIndigo: '#6366f1',
        accentPink: '#ec4899',
        accentTeal: '#14b8a6',
        textMuted: '#94a3b8',
        textLight: '#f8fafc',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
