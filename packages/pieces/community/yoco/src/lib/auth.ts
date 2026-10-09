import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const description = `
**Authentication**:
1. Log in to your Yoco dashboard at https://portal.yoco.com
2. Go to **Sales → Payment Gateway → Live Keys** (or **Test Keys** for testing)
3. Copy the **Secret Key** (starts with \`sk_live_\` or \`sk_test_\`)
4. Paste it here.
`;

export const yocoAuth = PieceAuth.CustomAuth({
  description,
  required: true,
  props: {
    secret_key: PieceAuth.SecretText({
      displayName: 'Secret Key',
      description: 'Your Yoco secret key (sk_live_... or sk_test_...).',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://online.yoco.com/v1/checkouts',
        headers: { Authorization: `Bearer ${auth.secret_key}` },
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: `Could not reach Yoco. Check your secret key. (${(e as Error).message})`,
      };
    }
  },
});
