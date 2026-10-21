import { PieceAuth } from '@activepieces/pieces-framework';
import { stsGet } from './client';

export const sellToStateAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:

1. Sign in at [app.selltostate.com](https://app.selltostate.com). Data needs an active plan.
2. Open **Account → API keys** ([app.selltostate.com/account/keys](https://app.selltostate.com/account/keys)).
3. Click **Create key** and copy it. You see it only once.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const me = await stsGet<{ active?: boolean }>({ apiKey: auth, path: '/whoami' });
      if (me.active === false) {
        return { valid: false, error: 'The key is valid, but the account has no active plan.' };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key, or Sell to State could not be reached.' };
    }
  },
});
