import { PieceAuth } from '@activepieces/pieces-framework';
import { calendlyCommon } from './common';

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
      calendlyCommon.getUser(auth);
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
