import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { mindeePredictDocumentAction } from './lib/actions/predict-document';

export const mindeeAuth = PieceAuth.SecretText({
  displayName: 'Api Key',
  description: `
  #### To obtain access your Api Key
  1. Sign up and log in to Mindee
  2. Go to [API Key page](https://app.mindee.com/api-keys)
  3. Copy the Key and paste below.
  `,
  required: true,
});

export const mindee = createPiece({
  displayName: 'Mindee',
  description: 'Document automation API',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mindee.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud','Sanket6652'],
  auth: mindeeAuth,
  actions: [
    mindeePredictDocumentAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api-v2.mindee.net/v2',
      auth: mindeeAuth,
      authMapping: async (auth) => ({
        Authorization: `Token ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
