import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { searchNewsAction } from './lib/actions/search-news';
import { webzAuth } from './lib/auth';

export const webz = createPiece({
	displayName: 'Webz.io',
	description: 'Webz.io News Search API for live news monitoring, sentiment tracking, and research.',
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/webz.png',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
	authors: ['PINYOPATTANAWASANPORN'],
	auth: webzAuth,
	actions: [
		searchNewsAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://api.webz.io',
			auth: webzAuth,
			authMapping: async (auth) => ({
				queryParams: { token: auth },
			}),
		}),
	],
	triggers: [],
});
