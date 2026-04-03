import { PieceAuth } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';
import { Client } from 'recurly';

export const recurlyAuth = PieceAuth.BasicAuth({
  displayName: 'Recurly API Key',
  description: `To get your Recurly API key:
1. Sign in to your Recurly account.
2. Open **Developers > API Credentials**.
3. Copy your private API key.
4. Paste it into the **API Key** field below.

Leave the password field blank unless your Recurly setup specifically requires it.`,
  required: true,
  username: {
    displayName: 'API Key',
    description: 'Your Recurly private API key.',
  },
  password: {
    displayName: 'Password',
    description: 'This field is ignored for standard Recurly API access. You can leave it blank.',
  },
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      new Client(auth.username).listSites().first(),
    );

    if (error) {
      return {
        valid: false,
        error: 'Invalid API key. Check the API key and try again.',
      };
    }

    return {
      valid: true,
    };
  },
});
