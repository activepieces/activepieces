import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { textToImage } from './lib/actions/text-to-image';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const stabilityAiAuth = PieceAuth.CustomAuth({
  description: `Please visit https://platform.stability.ai/docs/getting-started/authentication to get your API Key`,
  props: {
    api_key: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  required: true,
});

export const stabilityAi = createPiece({
  displayName: 'Stability AI',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stability-ai.png',
  authors: ['Willianwg', 'AbdulTheActivepiecer'],
  auth: stabilityAiAuth,
  actions: [
    textToImage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.stability.ai/v1',
      auth: stabilityAiAuth,
      authMapping: (auth) => ({
        'Authorization': `Bearer ${(auth as { api_key: string }).api_key}`,
      }),
    }),
  ],
  triggers: [],
});
