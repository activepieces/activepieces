import { AppConnectionType, PieceAuth } from '@activepieces/pieces-framework';

import { agentxApi } from './common/api';

export const agentxAuth = PieceAuth.SecretText({
  displayName: 'AgentX API Key',
  description: `**Enter your AgentX API Key**
---
### How to obtain your API key
1. Visit [AgentX](https://www.agentx.so/) and log in.
2. Click on your avatar (bottom-left corner).
3. Copy your API Key from the popup window.
4. Paste it here.

`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await agentxApi.listAgents({
          auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
        });
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid API Key or authentication failed.',
        };
      }
    }
    return {
      valid: false,
      error: 'API Key is required.',
    };
  },
});
