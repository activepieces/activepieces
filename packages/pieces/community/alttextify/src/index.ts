import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { alttextifyAuth } from './lib/common/auth';
import { ALTTEXTIFY_BASE_URL } from './lib/common/client';
import { generateAltTextAction } from './lib/actions/generate-alt-text';
import { getImageAction } from './lib/actions/get-image';
import { listImagesAction } from './lib/actions/list-images';
import { deleteImageAction } from './lib/actions/delete-image';
import { newAltTextGeneratedTrigger } from './lib/triggers/new-alt-text-generated';

export const alttextify = createPiece({
  displayName: 'AltTextify',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: alttextifyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/alttextify.png',
  authors: ['kishanprmr'],
  actions: [
    generateAltTextAction,
    getImageAction,
    listImagesAction,
    deleteImageAction,
    createCustomApiCallAction({
      auth: alttextifyAuth,
      baseUrl: () => ALTTEXTIFY_BASE_URL,
      authMapping: async (auth) => {
        return {
          'X-API-Key': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [newAltTextGeneratedTrigger],
});
