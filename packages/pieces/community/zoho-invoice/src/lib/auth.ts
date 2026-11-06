import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const zohoInvoiceAuth = PieceAuth.OAuth2({
	required: true,
	authUrl: 'https://accounts.zoho.{region}/oauth/v2/auth',
	tokenUrl: 'https://accounts.zoho.{region}/oauth/v2/token',
	scope: ['ZohoInvoice.fullaccess.all'],
	props: {
		region: Property.StaticDropdown({
			displayName: 'Region',
			description: 'Select your account region',
			required: true,
			options: {
				options: [
					{
						label: 'US (.com)',
						value: 'com',
					},
					{
						label: 'Europe (.eu)',
						value: 'eu',
					},
					{
						label: 'India (.in)',
						value: 'in',
					},
					{
						label: 'Australia (.com.au)',
						value: 'com.au',
					},
					{
						label: 'Japan (.jp)',
						value: 'jp',
					},
				],
			},
		}),
	},
});
