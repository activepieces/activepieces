import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { generateImage } from './lib/actions/generate-image.action';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit the following website: https://robolly.com/dashboard/account/
2. Once on the website, locate and copy your API Key.
Please, take into consideration: We don't test your API Key validity in order to save you some generations, so make sure this is the correct one.
`;

export const robollyAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async () => {
    return {
      valid: true,
    };
  },
});

export const robolly = createPiece({
  displayName: 'Robolly',
  description:
    'Robolly is the all‑in‑one service for personalized image, video & PDF generation with API',

  auth: robollyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/robolly.png',
  categories: [PieceCategory.MARKETING],
  authors: ["pfernandez98","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    generateImage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.robolly.com',
      auth: robollyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
