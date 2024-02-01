import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendSMS } from './lib/actions/send-sms';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const contigAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your Contiguity settings',
});

export const contiguity = createPiece({
  displayName: 'Contiguity',
  description: 'An SMS service for your needs - quick and simple',
  auth: contigAuth,
  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/contiguity.png',
  categories: [PieceCategory.MARKETING],
  authors: ['Owlcept'],
  actions: [
    sendSMS,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.contiguity.com/v1', // Replace with the actual base URL
      auth: contigAuth,
      authMapping: (auth) => ({
        authorization: `Token ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
