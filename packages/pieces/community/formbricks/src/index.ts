import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { triggers } from './lib/triggers';

const markdownPropertyDescription = `
  **Enable Basic Authentication:**
  1. Login to your Formbricks account
  2. On the top-right, click on your account dropdown
  3. Select 'Product Settings'
  4. On the left, select 'API Keys'
  5. Click on 'Add Production API Key'
  6. On the popup form, Enter the 'API Key Label' to name the Key
  7. Copy the API key and paste it below.
`;

export const formBricksAuth = PieceAuth.SecretText({
  displayName: 'Token',
  description: markdownPropertyDescription,
  required: true,
});

export const formbricks = createPiece({
  displayName: 'Formbricks',
  description: 'Open source Survey Platform',
  auth: formBricksAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/formbricks.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ["kanarelo","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createCustomApiCallAction({
      auth: formBricksAuth,
      authMapping(auth) {
        return {
          'x-Api-Key': auth as string,
        };
      },
      baseUrl: () => 'https://api.formbricks.com/v1',
    }),
  ],
  triggers,
});
