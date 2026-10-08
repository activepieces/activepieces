import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createSongAction } from './lib/actions/create-song';
import { getSongAction } from './lib/actions/get-song';
import { songupAuth } from './lib/common/auth';
import { SONGUP_API_URL } from './lib/common/client';
import { songFinishedTrigger } from './lib/triggers/song-finished';

export const songupAi = createPiece({
	displayName: 'SongUp AI',
	description: 'Make AI songs with vocals in 24 languages from an idea or your own lyrics.',
	auth: songupAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/songup-ai.png',
	authors: ['ismailgalaxys25-del'],
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
	actions: [
		createSongAction,
		getSongAction,
		createCustomApiCallAction({
			auth: songupAuth,
			baseUrl: () => SONGUP_API_URL,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${auth.secret_text}`,
			}),
		}),
	],
	triggers: [songFinishedTrigger],
});
