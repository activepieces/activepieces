import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { doctlyAuth } from './lib/auth';
import { doctlyClient } from './lib/common/client';
import { convertPdfToTextAction } from './lib/actions/convert-pdf-to-text';
import { doctlyAiActions } from './lib/actions/ai';

export const doctly = createPiece({
	displayName: 'Doctly AI',
	auth: doctlyAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/doctly.png',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
	authors: ['kishanprmr'],
	actions: [
		convertPdfToTextAction,
		...doctlyAiActions,
		createCustomApiCallAction({
			auth: doctlyAuth,
			baseUrl: () => doctlyClient.baseUrl(),
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth.secret_text}`,
				};
			},
		}),
	],
	triggers: [],
});
