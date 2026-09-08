/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ====================================================================
         DESIGN TOKENS — mirrored from CSS custom properties (Spec §1)
         Use these for utility classes; prefer var() in component CSS
         ==================================================================== */
      colors: {
        /* §1.1 Surfaces */
        'bg-app': 'var(--bg-app)',
        'bg-panel': 'var(--bg-panel)',
        'bg-raised': 'var(--bg-raised)',
        'bg-hover': 'var(--bg-hover)',
        'bg-active': 'var(--bg-active)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        
        /* §1.2 Text */
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        'text-disabled': 'var(--text-disabled)',
        
        /* §1.3 Accent + Semantic */
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          pressed: 'var(--accent-pressed)',
          subtle: 'var(--accent-subtle)',
        },
        success: {
          DEFAULT: 'var(--success)',
          subtle: 'var(--success-subtle)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          subtle: 'var(--warn-subtle)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          subtle: 'var(--danger-subtle)',
        },
        
        /* Legacy aliases (DEPRECATED — keep for gradual migration) */
        ink: 'var(--ink)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        raised: 'var(--raised)',
        line: 'var(--line)',
        'line-soft': 'var(--line-soft)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        'text-faint': 'var(--text-faint)',
        copper: 'var(--copper)',
        'copper-dim': 'var(--copper-dim)',
        'copper-glow': 'var(--copper-glow)',
        good: 'var(--good)',
        'good-bg': 'var(--good-bg)',
        bad: 'var(--bad)',
        'bad-bg': 'var(--bad-bg)',
      },
      
      /* §1.4 Typography */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        /* DELETE: slab font removed per spec §1.4 — replace all usages with sans */
      },
      
      fontSize: {
        /* Spec §1.4 type scale */
        overline: ['11px', { lineHeight: '1.45', letterSpacing: '0.08em' }],
        caption: ['12px', { lineHeight: '1.45' }],
        base: ['13px', { lineHeight: '1.45' }],
        lg: ['14px', { lineHeight: '1.45' }],
        section: ['16px', { lineHeight: '1.2', fontWeight: '600' }],
        page: ['20px', { lineHeight: '1.2', fontWeight: '650' }],
      },
      
      /* §1.5 Spacing (8pt grid) */
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '7': '48px',
      },
      
      /* Control heights */
      height: {
        'sm': '28px',
        'md': '36px',
        'lg': '44px',
        'row': '56px',
      },
      minHeight: {
        'sm': '28px',
        'md': '36px',
        'lg': '44px',
        'row': '56px',
      },
      
      /* §1.6 Radii */
      borderRadius: {
        'sm': '6px',   /* chips, kbd, badges */
        'md': '8px',   /* controls, inputs, buttons */
        'lg': '12px',  /* cards, modals, rail */
      },
      
      /* §1.8 Motion */
      transitionDuration: {
        'fast': '140ms',
        'med': '200ms',
        'slow': '280ms',
      },
      
      /* §1.9 Focus ring */
      ringColor: {
        accent: 'var(--accent)',
      },
      ringOffsetWidth: {
        'focus': '2px',
      },
      
      /* §1.10 Scrollbars */
      scrollbarWidth: {
        'thin': '8px',
      },
      
      /* Layout */
      maxWidth: {
        'content': '960px',  /* §5 form tabs max-width */
      },
      width: {
        'sidebar': '240px',  /* §3.5 sidebar fixed width */
        'rail': '360px',     /* §4.3 detail rail width */
      },
    },
  },
  plugins: [],
}
