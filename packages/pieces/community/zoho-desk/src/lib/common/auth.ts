import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const zohoDeskAuth = PieceAuth.OAuth2({
	props: {
		location: Property.StaticDropdown({
			displayName: 'Location',
			description: 'The location of your Zoho Desk account.',
			required: true,
			options: {
				options: [
					{
						label: 'zoho.eu (Europe)',
						value: 'zoho.eu',
					},
					{
						label: 'zoho.com (United States)',
						value: 'zoho.com',
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
						label: 'zoho.in (India)',
						value: 'zoho.in',
					},
					{
						label: 'zohocloud.ca (Canada)',
						value: 'zohocloud.ca',
					},
				],
			},
		}),
	},
	description: 'Authentication for Zoho Desk',
	scope: [
		'Desk.tickets.ALL',
		'Desk.tasks.ALL',
		'Desk.settings.ALL',
		'Desk.events.ALL',
		'Desk.contacts.READ',
		'Desk.contacts.WRITE',
		'Desk.contacts.UPDATE',
		'Desk.contacts.CREATE',
		'Desk.basic.READ',
		'Desk.basic.CREATE',
		'Desk.search.READ',
		'Desk.articles.READ',
		'Desk.articles.CREATE',
		'Desk.articles.UPDATE',
		'Desk.articles.DELETE',
	],
	authUrl: 'https://accounts.{location}/oauth/v2/auth',
	tokenUrl: 'https://accounts.{location}/oauth/v2/token',
	required: true,
});
