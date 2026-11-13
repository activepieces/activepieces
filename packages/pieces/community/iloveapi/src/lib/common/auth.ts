import { PieceAuth } from '@activepieces/pieces-framework';
import { ILoveApiError, iLoveApi } from './client';

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
    } catch (error) {
      const status = error instanceof ILoveApiError ? error.status : undefined;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid iLoveAPI project public key.' };
      }
      const reason = error instanceof Error ? error.message : String(error);
      return {
        valid: false,
        error: `Could not verify the key with iLoveAPI right now: ${reason}`,
      };
    }
  },
});
