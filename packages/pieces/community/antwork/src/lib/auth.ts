import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
/** The documented base URL of Antwork's REST API (`servers[0]` in antwork.io/openapi.json). */
export const ANTWORK_API_BASE = 'https://antwork.io/api/v1';

export const antworkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to Antwork and open your workspace
2. Go to **Settings > Developer > Manage API keys** ([docs](https://antwork.io/docs/api/keys))
3. Create a key with the scopes you need: \`read\` for the trigger and Get Post, \`write\` to create drafts, \`publish\` to schedule or publish, \`media\` to attach media URLs

The key starts with \`ak_\`.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${ANTWORK_API_BASE}/workspaces`,
        headers: { Authorization: `Bearer ${auth.trim()}` },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key. Create a new one in Antwork under Settings > Developer > Manage API keys.',
      };
    }
  },
});
