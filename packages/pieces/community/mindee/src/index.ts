import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { mindeePredictDocumentAction } from './lib/actions/predict-document';

export const mindeeAuth = PieceAuth.SecretText({
  displayName: 'Api Key',
  description: `
  #### To obtain access your Api Key
  1. Sign up and log in to Mindee
  2. Go to [API Key page](https://platform.mindee.com/api-keys)
  3. Copy the Key and paste below.
  `,
  required: true,
});

export const mindee = createPiece({
  displayName: 'Mindee',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mindee.png',
  authors: ['kanarelo'],
  auth: mindeeAuth,
  actions: [mindeePredictDocumentAction],
  triggers: [],
});
