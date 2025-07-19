import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import {
	webSearch,
	searchNews,
	generateImage,
	scrapeWebsite,
	crawlWebsite,
	extractDocument,
} from './lib/actions';
import { PieceCategory } from '@ensemble/shared';
import {
	AuthenticationType,
	createCustomApiCallAction,
	httpClient,
	HttpMethod,
} from '@ensemble/pieces-common';

export const dumplingAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: `
  You can obtain API key from [API Section](https://app.dumplingai.com/api-keys).`,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				url: 'https://app.dumplingai.com/api/v1/search',
				method: HttpMethod.POST,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth,
				},
				body: {
					query: 'Ensemble',
				},
			});

			return {
				valid: true,
			};
		} catch (e) {
			return { valid: false, error: 'Invalid API Key.' };
		}
	},
});

export const dumplingAi = createPiece({
	displayName: 'Dumpling AI',
	description:'Transform unstructured website content into clean, AI-ready data',
	auth: dumplingAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.ensemble.com/pieces/dumpling-ai.png',
	authors: ['neo773'],
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.PRODUCTIVITY],
	actions: [
		webSearch,
		searchNews,
		generateImage,
		scrapeWebsite,
		crawlWebsite,
		extractDocument,
		createCustomApiCallAction({
			baseUrl: () => 'https://app.dumplingai.com/api/v1',
			auth: dumplingAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${auth}`,
			}),
		}),
	],
	triggers: [],
});
