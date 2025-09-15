import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendText } from './lib/actions/send/text';
import { send_iMessage } from './lib/actions/send/imessage';

export const contiguityAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Authenticate with the Contiguity API using a revocable key. Create one at console.contiguity.com/dashboard/tokens',
});

export const contiguity = createPiece({
  displayName: 'Contiguity',
  description: 'Communications for what you\'re building',
  auth: contiguityAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/contiguity.png',
  authors: ["Owlcept","Ozak93","kishanprmr","MoShizzle","abuaboud","Contiguity"],
  categories: [PieceCategory.MARKETING],
  actions: [
    sendText,
    send_iMessage,
    createCustomApiCallAction({
            baseUrl: () => 'https://api.contiguity.com',
            auth: contiguityAuth,
            authMapping: async (auth) => ({
                authorization: `Bearer ${auth}`,
            }),
    }),
  ],
  triggers: [],
});
