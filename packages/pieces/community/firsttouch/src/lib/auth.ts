import { PieceAuth } from '@activepieces/pieces-framework';
import { firstTouchClient, FirstTouchApiError } from './common/client';

const markdownDescription = `
To get your API key:
1. Log in to [FirstTouch](https://app.firsttouch.ai) as a team admin
2. Go to **Settings → MCP & API**
3. Create an API key and copy it

The key acts as you on your current FirstTouch team.
`;

export const firstTouchAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await firstTouchClient.callTool({ apiKey: auth, tool: 'get_current_user' });
      return { valid: true };
    } catch (error: unknown) {
      if (error instanceof FirstTouchApiError && (error.statusCode === 401 || error.statusCode === 403)) {
        return { valid: false, error: 'Invalid API key. Create a new one in FirstTouch under Settings → MCP & API.' };
      }
      return { valid: false, error: 'Could not reach FirstTouch to check the API key. Please try again.' };
    }
  },
});
