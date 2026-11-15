import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { generateAltTextAction } from './lib/actions/generate-alt-text';
import { getImageAction } from './lib/actions/get-image';
import { listImagesAction } from './lib/actions/list-images';
import { searchImagesAction } from './lib/actions/search-images';
import { updateImageAction } from './lib/actions/update-image';
import { deleteImageAction } from './lib/actions/delete-image';
import { getAccountAction } from './lib/actions/get-account';
import { altTextAiAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/constants';

export const altTextAi = createPiece({
  displayName: 'AltText.ai',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: altTextAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/alt-text-ai.png',
  authors: ['kishanprmr'],
  actions: [
    generateAltTextAction,
    getImageAction,
    listImagesAction,
    searchImagesAction,
    updateImageAction,
    deleteImageAction,
    getAccountAction,
    createCustomApiCallAction({
      auth: altTextAiAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          'X-API-Key': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
