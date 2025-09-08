import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const zohoCampaignsAuth = PieceAuth.OAuth2({
	props: {
		location: Property.StaticDropdown({
			displayName: 'Location',
			description: 'The location of your Zoho Campaigns account.',
			required: true,
			options: {
				options: [
					{ label: 'zoho.eu (Europe)', value: 'zoho.eu' },
					{ label: 'zoho.com (United States)', value: 'zoho.com' },
					{ label: 'zoho.com.au (Australia)', value: 'zoho.com.au' },
					{ label: 'zoho.jp (Japan)', value: 'zoho.jp' },
					{ label: 'zoho.in (India)', value: 'zoho.in' },
					{ label: 'zohocloud.ca (Canada)', value: 'zohocloud.ca' },
				],
			},
		}),
	},
	description: 'Authentication for Zoho Campaigns',
	scope: [
		'ZohoCampaigns.campaign.ALL',
		'ZohoCampaigns.contact.ALL',
	],
	authUrl: 'https://accounts.{location}/oauth/v2/auth',
	tokenUrl: 'https://accounts.{location}/oauth/v2/token',
	required: true,
});


