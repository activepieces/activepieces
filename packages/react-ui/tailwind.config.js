const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

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
      width: {
        '4.5': '1.125rem'
      },
      height: {
        '4.5': '1.125rem',
      },
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
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
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
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)',
        xs: 'calc(var(--radius) - 8px)',
        xss: 'calc(var(--radius) - 10px)',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xss': '0.65rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
      },
      keyframes: {
       'primary-color-pulse': {
           from: { color: 'hsl(var(--primary))' },
           to: { color: 'hsl(var(--primary)/0.7)' },
        },
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
        highlight: {
          '0%': {
            backgroundColor: 'hsl(var(--primary-100))',
          },
          '100%': {
            backgroundColor: 'hsl(var(--secondary))',
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
        'ask-ai-background':{
         '0%': {
          backgroundPosition: '0%'
          },
          '50%': {
            backgroundPosition: '100%'
          },
          '100%': {
            backgroundPosition: '0%'
          }
        },
        'slide-in-from-bottom': {
          '0%': {
            transform: 'translateY(100%)'
          },
          '100%': {
            transform: 'translateY(0%)'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        fade: 'fade 0.2s ease-out',
        highlight: 'highlight 1s ease-out',
        typing: 'typing 0.7s steps(7) alternate',
        'typing-sm': 'typing 0.5s steps(5) alternate',
        'ask-ai-background' : 'ask-ai-background 4s ease-in-out infinite',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.2s ease-out forwards',
        'primary-color-pulse': 'primary-color-pulse 1s ease-in-out infinite alternate'
      },
      boxShadow: {
        'step-container': '0px 0px 22px hsl(var(--border) / 0.4)',
        'add-button': 'var(--add-button-shadow)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'),require('tailwind-scrollbar')],
};
