import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { explainNote } from './lib/actions/explain-note';
import { findPerfumeAlternatives } from './lib/actions/find-perfume-alternatives';
import { findSimilarPerfumes } from './lib/actions/find-similar-perfumes';
import { getHouse } from './lib/actions/get-house';
import { getPerfume } from './lib/actions/get-perfume';
import { listHouses } from './lib/actions/list-houses';
import { searchGuides } from './lib/actions/search-guides';
import { searchPerfumes } from './lib/actions/search-perfumes';
import { API_BASE_URL } from './lib/common/client';

export const tenMlPerfume = createPiece({
	displayName: '10ML Perfume Finder',
	description:
		'Free perfume and fragrance API: search 6,000+ perfumes, get note pyramids and accords, find similar scents and alternatives, and explain notes and houses from the 10ML Fragrance Index. No API key.',
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/10ml-perfume.png',
	categories: [PieceCategory.COMMERCE],
	auth: PieceAuth.None(),
	authors: ['10ml-com'],
	actions: [
		searchPerfumes,
		getPerfume,
		findSimilarPerfumes,
		findPerfumeAlternatives,
		explainNote,
		getHouse,
		listHouses,
		searchGuides,
		createCustomApiCallAction({
			baseUrl: () => API_BASE_URL,
			authMapping: async () => ({}),
			description: 'Make a custom GET request to the 10ML Perfume Finder API (https://mcp.10ml.com/api/v1).',
		}),
	],
	triggers: [],
});
