import { OAuth2GrantType, PieceAuth, Property } from '@activepieces/pieces-framework';

export const zohoBookingsAuth = PieceAuth.OAuth2({
	props: {
		location: Property.StaticDropdown({
			displayName: 'Data Center',
			description: 'The data center location of your Zoho Bookings account',
			required: true,
			options: {
				options: [
					{
						label: 'zoho.com (United States)',
						value: 'zoho.com',
					},
					{
						label: 'zoho.eu (Europe)',
						value: 'zoho.eu',
					},
					{
						label: 'zoho.in (India)',
						value: 'zoho.in',
					},
					{
						label: 'zoho.com.au (Australia)',
						value: 'zoho.com.au',
					},
					{
						label: 'zoho.jp (Japan)',
						value: 'zoho.jp',
					},
					{
						label: 'zoho.com.cn (China)',
						value: 'zoho.com.cn',
					},
				],
			},
		}),
	},
	description: 'Connect your Zoho Bookings account using OAuth2',
	grantType: OAuth2GrantType.AUTHORIZATION_CODE,
	required: true,
	authUrl: 'https://accounts.{location}/oauth/v2/auth',
	tokenUrl: 'https://accounts.{location}/oauth/v2/token',
	scope: ['zohobookings.data.CREATE', 'zohobookings.data.READ'],
});
