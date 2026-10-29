import { PieceAuth } from '@activepieces/pieces-framework';
import { listAccounts, tokenOf, WorkableApiError } from './common/client';

export const workableAuth = PieceAuth.SecretText({
  displayName: 'API Access Token',
  description: `
1. In Workable, click your profile icon in the upper right and open **Settings → Integrations**.
2. In the **API Access Tokens** section, click **Generate new token**.
3. Select these scopes:
   - r_jobs
   - r_candidates
   - w_candidates
   - w_comments (optional, for Add Comment)
4. Click **Generate token** and paste it here. Workable shows the token only once.

If the token can see several Workable accounts, steps use the first one unless you fill **Account Subdomain**.
`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const accounts = await listAccounts(tokenOf(auth));
      if (accounts.length === 0) {
        return { valid: false, error: 'This token cannot see any Workable account.' };
      }
      return { valid: true };
    } catch (error) {
      if (error instanceof WorkableApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid API access token.' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach Workable.' };
    }
  },
});
