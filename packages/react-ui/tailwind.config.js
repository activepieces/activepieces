const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}',
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    transitionTimingFunction: {
      'expand-out': 'cubic-bezier(0.35, 0, 0.25, 1)',
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      transitionDuration: {
        1500: '1500ms',
      },
      colors: {
        'light-blue': 'hsl(var(--light-blue))',
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          100: 'hsl(var(--warning-100))',
          300: 'hsl(var(--warning-300))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          100: 'hsl(var(--primary-100))',
          300: 'hsl(var(--primary-300))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          100: 'hsl(var(--success-100))',
          300: 'hsl(var(--success-300))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          100: 'hsl(var(--destructive-100))',
          300: 'hsl(var(--destructive-300))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
        xs: 'calc(var(--radius) - 8px)',
        xss: 'calc(var(--radius) - 10px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      fontSize: {
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        fade: {
          '0%': {
            opacity: 0,
          },
          '100%': {
            opacity: 1,
          },
        },
        typing: {
          "0%": {
            width: "0%",
            visibility: "hidden",
          },
          "100%": {
            width: "100%",
          }
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fade: 'fade 0.2s ease-out',
        typing: 'typing 0.7s steps(7) alternate',
        'typing-sm': 'typing 0.5s steps(5) alternate',
      },
      boxShadow: {
        'step-container': '0px 0px 22px hsl(var(--border) / 0.4)',
        'add-button': 'var(--add-button-shadow)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
