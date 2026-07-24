import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { searchAction } from './lib/actions/search';
import { extractAction } from './lib/actions/extract';
import { qnaAction } from './lib/actions/qna';
import { tavilyAuth } from './lib/auth';

export const tavily = createPiece({
	displayName: 'Tavily',
	description: 'Search engine tailored for AI agents.',
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/tavily.jpg',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
	authors: ['OsamaHaikal', 'mahenoorsalat'],
	auth: tavilyAuth,
	actions: [
		searchAction,
		extractAction,
		qnaAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://api.tavily.com',
			auth: tavilyAuth,
			authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
		})
	],
	triggers: [],
});
