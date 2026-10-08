import { PieceAuth } from '@activepieces/pieces-framework';
import { formgongApi } from './common/client';

export const formgongAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `To get your API token:
1. Sign in to Formgong and open [Dashboard → Account → API tokens](https://formgong.com/dashboard/account#api-tokens).
2. Under **Access**, tick **Create forms** and **Read recent submissions**.
3. Set **Expires** to **Never**; otherwise the connection stops working when the token expires (90 days by default).
4. Click **Create token** and copy it. It starts with \`fgp_\` and is shown only once.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await formgongApi.callTool({ token: auth, tool: 'list_forms' });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not reach Formgong to check this token.',
      };
    }
  },
});
