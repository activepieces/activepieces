import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const flowiseAuth = PieceAuth.CustomAuth({
	description: 'Enter your Flowise URL and API Key',
	props: {
		base_url: Property.ShortText({
			displayName: 'Base URL',
			description: 'Enter the base URL',
			required: true,
		}),
		access_token: PieceAuth.SecretText({
			displayName: 'API Key',
			description: 'Enter the API Key',
			required: true,
		}),
	},
	required: true,
});
