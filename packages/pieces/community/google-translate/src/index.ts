import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { customApiCallAction } from './lib/actions/custom-api-call';
import { detectLanguageAction } from './lib/actions/detect-language';
import { listLanguagesAction } from './lib/actions/list-languages';
import { translateTextAction } from './lib/actions/translate-text';
import { googleTranslateAuth } from './lib/auth';

export const googleTranslate = createPiece({
	displayName: 'Google Translate',
	description: 'Translate text and detect languages with Google Cloud Translation.',
	auth: googleTranslateAuth,
	minimumSupportedRelease: '0.88.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-translate.png',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
	authors: ['fabio-kozlowski'],
	actions: [
		translateTextAction,
		detectLanguageAction,
		listLanguagesAction,
		customApiCallAction,
	],
	triggers: [],
});
