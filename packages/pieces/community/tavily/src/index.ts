import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { searchAction } from './lib/actions/search';
import { extractAction } from './lib/actions/extract';
import { crawlWebsiteAction } from './lib/actions/ai/crawl-website';
import { mapWebsiteAction } from './lib/actions/ai/map-website';
import { startResearchTaskAction } from './lib/actions/ai/start-research-task';
import { getResearchTaskAction } from './lib/actions/ai/get-research-task';
import { getUsageAction } from './lib/actions/ai/get-usage';
import { tavilyAuth } from './lib/auth';

export const tavily = createPiece({
	displayName: 'Tavily',
	description: 'Search engine tailored for AI agents.',
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/tavily.jpg',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
	authors: ['OsamaHaikal'],
	auth: tavilyAuth,
	actions: [
		searchAction,
		extractAction,
		crawlWebsiteAction,
		mapWebsiteAction,
		startResearchTaskAction,
		getResearchTaskAction,
		getUsageAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://api.tavily.com',
			auth: tavilyAuth,
			authMapping: async (auth) => ({ Authorization: `Bearer ${auth.secret_text}` }),
		})
	],
	triggers: [],
});
