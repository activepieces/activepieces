import { PieceAuth } from '@activepieces/pieces-framework';
import { makeClient } from './common';

const markdown = `
To obtain your API key, follow these steps:

1.Go to **settings** by clicking your profile-pic (top-right).\n
2.Navigate to **API Integrations** section.\n
3.Under **API USER KEY** ,copy API key.\n
`;

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
