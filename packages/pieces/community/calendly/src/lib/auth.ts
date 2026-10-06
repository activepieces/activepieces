import { PieceAuth } from '@activepieces/pieces-framework';
import { calendlyCommon } from './common';

const markdown = `
## Obtain your Calendly Personal Token
1. Go to https://calendly.com/integrations/api_webhooks
2. Click on "Create New Token"
3. Select these scopes: \`users:read\`, \`organizations:read\`, \`event_types:read\`, \`event_types:write\`, \`availability:read\`, \`availability:write\`, \`scheduled_events:read\`, \`scheduled_events:write\`, \`scheduling_links:write\`, \`shares:write\`, \`locations:read\`, \`webhooks:read\`, \`webhooks:write\`
4. Copy the token and paste it in the field below
`;

export const calendlyAuth = PieceAuth.SecretText({
  displayName: 'Personal Token',
  required: true,
  description: markdown,
  validate: async ({ auth }) => {
    try {
      await calendlyCommon.getUser(auth);
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
