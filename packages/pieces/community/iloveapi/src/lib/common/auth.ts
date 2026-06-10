import { PieceAuth } from '@activepieces/pieces-framework';
import { iLoveApi } from './client';

export const iloveapiAuth = PieceAuth.SecretText({
  displayName: 'Project Public Key',
  required: true,
  description: `
To get your project public key:

1. Sign up or log in at https://developer.ilovepdf.com/
2. Open your project on the developer dashboard
3. Copy the **Project public key** (starts with \`project_public_\`)
4. Paste it here

Only the public key is required. Tokens are issued automatically per request.
  `,
  validate: async ({ auth }) => {
    try {
      await iLoveApi.authenticate({ publicKey: auth });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid iLoveAPI project public key.',
      };
    }
  },
});
