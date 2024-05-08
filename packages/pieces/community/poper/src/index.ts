import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { newLead } from './lib/triggers/new-lead';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

export const poperAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description:
		'Use the Poper API key to authenticate the piece. You can find your API key in the Poper settings.',
	required: true,
	validate: async ({ auth }) => {
		const request: HttpRequest = {
			method: HttpMethod.POST,
			url: 'https://api.poper.ai/general/v1/ping',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: {
				api_key: auth,
			},
		};

		try {
			const res = await httpClient.sendRequest(request);

			if (res.status === 200) {
				return {
					valid: true,
				};
			}

			return {
				valid: false,
				error: 'API Key is invalid',
			};
		} catch (e) {
			return {
				valid: false,
				error: 'API Key is invalid',
			};
		}
	},
});

export const poper = createPiece({
	displayName: 'Poper',
	auth: poperAuth,
	minimumSupportedRelease: '0.20.0',
	categories: [PieceCategory.MARKETING],
	description:
		'AI Driven Pop-up Builder that can convert visitors into customers,increase subscriber count, and skyrocket sales.',
	logoUrl: 'https://cdn.activepieces.com/pieces/poper.png',
	authors: ['thirstycode'],
	actions: [],
	triggers: [newLead],
});
