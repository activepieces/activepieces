import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { textToImage } from './lib/actions/text-to-image';

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
  description:
    'Generative AI video model based on the image model Stable Diffusion.',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stability-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["Willianwg","camilou","kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: stabilityAiAuth,
  actions: [
    textToImage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.stability.ai/v1',
      auth: stabilityAiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { api_key: string }).api_key}`,
      }),
    }),
  ],
  triggers: [],
});
