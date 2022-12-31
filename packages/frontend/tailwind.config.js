const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
	prefix: 'ap-',
	content: ['./src/**/*.{html,ts}'],
	theme: {
		extend: {
			fontFamily: {
				"sans" :[ 'Open Sans,sans-serif' , ...defaultTheme.fontFamily.sans],
			},
			backgroundImage: {
				authBg: "url('/assets/img/custom/auth/auth-bg.png')",
				nofbg: "url('/assets/img/custom/auth/404.svg')",
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
				primary: '#6e41e2',
				warn: '#F06D0E',
				blueLink: '#1890ff',
				sidebar: '#FAFBFC',
				blueBorder: '#6385dc',
				purpleBorder: '#af6cd9',
				greenBorder: '#5Fd2b0',
				description: '#8C8C8C',
				hover: '#fafafa',
				success: '#209e34',
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
	plugins: [],
};
