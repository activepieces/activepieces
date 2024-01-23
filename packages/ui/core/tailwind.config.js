const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'ap-',
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Open Sans,sans-serif', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        'step-container-ds': '0px 0px 22px rgba(186, 186, 191, 0.3)',
        'portal-ds': '0px 0px 90px rgba(0, 0, 0, 0.14)',
      },
      backgroundImage: {
        authBg: "url('/assets/img/custom/auth/auth-bg.png')",
        nofbg: "url('/assets/img/custom/auth/404.svg')",
      },
      spacing: {
        7.5: '1.875rem',
        15: '3.75rem'
      },
      colors: {
        title:'var(--title)',
        line:'var(--line)',
        header: 'var(--header)',
        dividers: 'var(--dividers)',
        body: 'var(--body)',
        border: 'var(--border)',
        white: 'var(--white)',
        'gray-card': 'var(--gray-card)',
        placeholder: 'var(--placeholder)',
        'form-label': 'var(--form-label)',
        black: 'var(--black)',
        disable: 'var(--disable)',
        sidebar: 'var(--sidebar)',
        hover:'var(--hover)',
        avatar: 'var(--avatar)',
        'blue-link': 'var(--blue-link)',
        'gray-select': 'var(--gray-select)',
        'add-piece': 'var(--add-piece)',
        outline: 'var(--outline)',
        description: 'var(--description)',
        danger: 'var(--danger)',
        primary: { DEFAULT: 'var(--primary-default)',
        medium:'var(--primary-medium)',
         light: 'var(--primary-light)', 
         dark: 'var(--primary-dark)' },
        warn: {
         DEFAULT:'var(--warn-default)',
         light:"var(--warn-light)",
         dark:"var(--warn-dark)",
         medium:"var(--warn-medium)"},
        success: {
          DEFAULT:'var(--success-default)',
          light:'var(--success-light)'
        },
       'bleached-gray':'var(--bleached-gray)',
       'selection': 'var(--selection)'
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
      },
    },
  },
  variants: {
    extend: {
      display: ['group-hover'],
    },
  },
  plugins: [],
};
