import { PieceAuth } from '@activepieces/pieces-framework';
import { jobvettaGet } from './common/client';

export const jobvettaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
**Get your Jobvetta API key:**

1. Visit https://www.jobvetta.com/api (free tier includes 25 requests/day with no credit card required).
2. Generate your \`jvk_...\` API key.
3. Paste the raw key here.
  `,
  validate: async ({ auth }) => {
    try {
      await jobvettaGet({
        apiKey: auth,
        path: '/usage',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error ? e.message : 'Invalid Jobvetta API key',
      };
    }
  },
});
