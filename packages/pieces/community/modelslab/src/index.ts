import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { textToImage } from './lib/actions/text-to-image';

export const modelsLabAuth = PieceAuth.CustomAuth({
  description: `Get your API key at https://modelslab.com/account/api-key`,
  props: {
    api_key: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  required: true,
});

export const modelsLab = createPiece({
  displayName: 'ModelsLab',
  description:
    'ModelsLab is a developer-first AI API platform for text-to-image generation, video creation, voice cloning, and more.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/modelslab.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['adhikjoshi'],
  auth: modelsLabAuth,
  actions: [
    textToImage,
    createCustomApiCallAction({
      baseUrl: () => 'https://modelslab.com/api/v6',
      auth: modelsLabAuth,
      authMapping: async (auth) => ({
        'Content-Type': 'application/json',
      }),
    }),
  ],
  triggers: [],
});
