import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { pushMessage } from './lib/actions/push-message';
import { newMessage } from './lib/trigger/new-message';

export const lineAuth2 = PieceAuth.SecretText({
  displayName: 'Bot Token',
  required: true,
});

export const line = createPiece({
  displayName: 'Line Bot',
  description: 'Build chatbots for LINE',

  auth: lineAuth2,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/line.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    pushMessage,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.line.me/v2',
      auth: lineAuth2,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [newMessage],
});
