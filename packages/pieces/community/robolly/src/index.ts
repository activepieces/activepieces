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
  auth: robollyAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/robolly.png',
  authors: ['PFernandez98'],
  categories: [PieceCategory.IT_OPERATIONS],
  actions: [generateImage],
  triggers: [],
});
