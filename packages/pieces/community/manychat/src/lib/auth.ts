import { PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './common/props';

export const manychatAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: `You can create an API key by navigating to **Setting -> Extensions -> API**.`,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: `${BASE_URL}/page/getInfo`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth
				},
			});
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid API Key',
			};
		}
	},
});
