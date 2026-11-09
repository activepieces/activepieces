import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { editImage } from './lib/actions/edit-image';
import { generateImage } from './lib/actions/generate-image';
import { getAccountDetails } from './lib/actions/get-account-details';
import { removeBackground } from './lib/actions/remove-background';
import { photoroomAuth } from './lib/auth';
import { PHOTOROOM_IMAGE_API_BASE_URL } from './lib/common/client';

export const photoroom = createPiece({
  displayName: 'Photoroom',
  description:
    'AI photo editing: remove backgrounds, generate AI backgrounds, create images from prompts and retouch product photos',
  auth: photoroomAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/photoroom.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['AdamSelene', 'Charles-Go'],
  actions: [
    removeBackground,
    editImage,
    generateImage,
    getAccountDetails,
    createCustomApiCallAction({
      baseUrl: () => PHOTOROOM_IMAGE_API_BASE_URL,
      auth: photoroomAuth,
      authMapping: async (auth) => ({
        'x-api-key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
