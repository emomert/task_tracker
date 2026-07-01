/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mapped to the CSS variables defined in src/index.css (see 04-design.md).
        // Channel form so opacity modifiers (bg-accent/90) work.
        paper: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        line: 'rgb(var(--border) / <alpha-value>)',
        ink: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
        // Status indicators (small dots/chips).
        status: {
          notstarted: 'rgb(var(--status-not-started) / <alpha-value>)',
          inprogress: 'rgb(var(--status-in-progress) / <alpha-value>)',
          done: 'rgb(var(--status-done) / <alpha-value>)',
        },
        // Priority markers.
        priority: {
          low: 'rgb(var(--priority-low) / <alpha-value>)',
          medium: 'rgb(var(--priority-medium) / <alpha-value>)',
          high: 'rgb(var(--priority-high) / <alpha-value>)',
        },
        // AA-contrast red for error/validation TEXT (see --danger-text).
        danger: 'rgb(var(--danger-text) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        meta: ['12px', { lineHeight: '1.4' }],
        label: ['13px', { lineHeight: '1.4' }],
        ui: ['14px', { lineHeight: '1.5' }],
        editor: ['16px', { lineHeight: '1.7' }],
        title: ['20px', { lineHeight: '1.3' }],
        display: ['28px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 15, 15, 0.04)',
        drag: '0 8px 24px rgba(15, 15, 15, 0.12)',
        panel: '-8px 0 24px rgba(15, 15, 15, 0.06)',
      },
      maxWidth: {
        canvas: '960px',
      },
      transitionDuration: {
        sidebar: '150ms',
      },
    },
  },
  plugins: [],
}
