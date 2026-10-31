import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { textToImage } from './lib/actions/text-to-image';

const STABILITY_BASE_URL = 'https://api.stability.ai/v1';

export const stabilityAiAuth = PieceAuth.CustomAuth({
  description: `To get your API key:
1. Sign in at [platform.stability.ai](https://platform.stability.ai).
2. Open **Account → API Keys**.
3. Copy a key and paste it below.`,
  props: {
    api_key: Property.ShortText({
      displayName: 'API Key',
      description: 'Found under Account → API Keys on platform.stability.ai.',
      required: true,
    }),
  },
  required: true,
});

export const stabilityAi = createPiece({
  displayName: 'Stability AI',
  description:
    'Generate images from text with Stable Diffusion models.',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/stability-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["Willianwg","camilou","kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: stabilityAiAuth,
  actions: [
    textToImage,
    createCustomApiCallAction({
      baseUrl: () => STABILITY_BASE_URL,
      props: {
        url: {
          description: `Full URL, or a path relative to ${STABILITY_BASE_URL}`,
          placeholder: '/engines/list',
        },
      },
      auth: stabilityAiAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.api_key}`,
      }),
    }),
  ],
  triggers: [],
});
