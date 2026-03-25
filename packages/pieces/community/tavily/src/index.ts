import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { searchAction } from './lib/actions/search';
import { extractAction } from './lib/actions/extract';
import { tavilyAuth } from './lib/auth';

const markdownDescription = `
Follow these steps to obtain your Tavily API Key:

1. Visit [tavily](https://tavily.com/) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the dashboard.
`;

export const tavily = createPiece({
	displayName: 'Tavily',
	description: 'Search engine tailored for AI agents.',
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/tavily.jpg',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
	authors: ['OsamaHaikal'],
	auth: tavilyAuth,
	actions: [searchAction, extractAction],
	triggers: [],
});
