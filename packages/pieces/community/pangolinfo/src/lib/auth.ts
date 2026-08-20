import { PieceAuth } from '@activepieces/pieces-framework';
import { pangolinfoClient } from './common';

const pangolinfoAuth = PieceAuth.SecretText({
  displayName: 'Pangolinfo API Key',
  description:
    'Create a key in the [Pangolinfo Console](https://tool.pangolinfo.com/). Each user supplies their own key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await pangolinfoClient.validateKey(auth);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Pangolinfo rejected the API key. Create or enter a valid key.',
      };
    }
  },
});

export { pangolinfoAuth };
