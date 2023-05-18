const { createGlobPatternsForDependencies } = require('@nrwl/angular/tailwind');
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
      boxShadow:{
        'step-container-ds':'0px 0px 22px rgba(186, 186, 191, 0.3)',
        'portal-ds' : '0px 0px 90px rgba(0, 0, 0, 0.14)'
      },
      backgroundImage: {
        authBg: "url('/assets/img/custom/auth/auth-bg.png')",
        nofbg: "url('/assets/img/custom/auth/404.svg')",
      },
      spacing: {
        '7.5': '1.875rem',
      },
      colors: {
        body: '#4f4f4f',
        border: '#c2c9d1',
        white: '#ffffff',
        grayCard: '#fafafa',
        placeholder: '#c8c8c8',
        danger: {
          DEFAULT: '#dc3545',
          light: '#efa2a980',
        },
        primary: { DEFAULT: '#6e41e2', light: '#EEE8FC', dark: '#472c8a','10':'rgba(110, 65, 226, 0.1)' },
        warn: {
         DEFAULT:'#f78a3b',
         light:"#FFF6E4",
         dark:"#CC8805",
         medium:"#F0D6A1"},
         blue:{
          DEFAULT:'#189EFF',
          light: '#EDF8FF',
          dark: '#006DF0'
         },
         green: {
          DEFAULT: '#35b45f4d',
          light: '#E1F4E7',
          dark: '#35B45F'
         },
        blueLink: '#1890ff',
        sidebar: '#FAFBFC',
        blueBorder: '#6385dc',
        purpleBorder: '#af6cd9',
        greenBorder: '#5Fd2b0',
        description: '#8C8C8C',
        hover: '#fafafa',
        success: '#209e34',
        dividers: '#e0e4e8',
        graySelect: '#F5F5F5',
        title:'#262626',
        bleachedGray:'#A6B1BF',
        disable:'#AAAAAA'
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
        display: ["group-hover"],
    },
},
  plugins: [],
};
