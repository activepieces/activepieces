import { PieceAuth } from '@activepieces/pieces-framework';
import { makeClient } from './common';

const markdown = `To get your API key:

1. In VBOUT, click your profile picture (top right) and open **Settings**.
2. Open **API Integrations**.
3. Copy the key under **API USER KEY**.`;

export const vboutAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdown,
  async validate({ auth }) {
    const client = makeClient(auth);
    try {
      await client.validateAuth();
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});
