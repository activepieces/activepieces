import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { ActiveCampaignApiError, ActiveCampaignClient } from './common/client';

const authGuide = `
To obtain your ActiveCampaign API URL and Key, follow these steps:

1. Log in to your ActiveCampaign account.
2. Navigate to **Settings->Developer** section.
3. Under **API Access** ,you'll find your API URL and Key.
`;

async function validateConnection({ apiUrl, apiKey }: { apiUrl: string; apiKey: string }): Promise<{ valid: true } | { valid: false; error: string }> {
	try {
		await new ActiveCampaignClient({ apiUrl, apiKey }).authenticate();
		return { valid: true };
	} catch (error) {
		if (error instanceof ActiveCampaignApiError && (error.status === 401 || error.status === 403)) {
			return { valid: false, error: `Invalid API URL or key: ActiveCampaign answered ${error.status}. Copy both from Settings > Developer.` };
		}
		if (error instanceof ActiveCampaignApiError && error.status === 404) {
			return { valid: false, error: `The API URL does not point at the ActiveCampaign API (404). Use the URL from Settings > Developer, for example https://youraccount.api-us1.com. ${error.message}` };
		}
		return { valid: false, error: error instanceof Error ? error.message : String(error) };
	}
}

export const activeCampaignAuth = PieceAuth.CustomAuth({
	required: true,
	description: authGuide,
	props: {
		apiUrl: Property.ShortText({
			displayName: 'API URL',
			description: 'For example https://youraccount.api-us1.com',
			required: true,
		}),
		apiKey: PieceAuth.SecretText({
			displayName: 'API Key',
			required: true,
		}),
	},
	validate: async ({ auth }) => validateConnection({ apiUrl: auth.apiUrl, apiKey: auth.apiKey }),
});
