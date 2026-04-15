import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const uptimeRobotAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your [UptimeRobot Dashboard](https://dashboard.uptimerobot.com/)
2. Click **Integrations & API** in the left sidebar
3. Scroll to the **API** section
4. Click **Show** next to your Main API Key
5. Copy the key and paste it here

The key starts with \`u\` followed by a long string of numbers and letters.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{
        stat: string;
        error?: { message: string };
      }>({
        method: HttpMethod.POST,
        url: 'https://api.uptimerobot.com/v2/getAccountDetails',
        headers: { 'Content-Type': 'application/json' },
        body: { api_key: auth, format: 'json' },
      });
      if (response.body.stat === 'ok') {
        return { valid: true };
      }
      return {
        valid: false,
        error: response.body.error?.message ?? 'Invalid API key',
      };
    } catch {
      return { valid: false, error: 'Could not connect to UptimeRobot API. Check your API key.' };
    }
  },
});
