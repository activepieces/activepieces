import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { calendlyCommon } from './lib/common';
import { calendlyInviteeCanceled } from './lib/trigger/invitee-canceled.trigger';
import { calendlyInviteeCreated } from './lib/trigger/invitee-created.trigger';

const markdown = `
## Obtain your Calendly Personal Token
1. Go to https://calendly.com/integrations/api_webhooks
2. Click on "Create New Token"
3. Copy the token and paste it in the field below
`;
export const calendlyAuth = PieceAuth.SecretText({
  displayName: 'Personal Token',
  required: true,
  description: markdown,
  validate: async ({ auth }) => {
    try {
      const user = calendlyCommon.getUser(auth);
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Connection failed. Please check your token and try again.',
      };
    }
  },
});

export const calendly = createPiece({
  displayName: 'Calendly',
  description: 'Simple, modern scheduling',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/calendly.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","MoShizzle","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: calendlyAuth,
  actions: [
    createCustomApiCallAction({
      baseUrl: () => calendlyCommon.baseUrl, // Replace with the actual base URL
      auth: calendlyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [calendlyInviteeCreated, calendlyInviteeCanceled],
});
