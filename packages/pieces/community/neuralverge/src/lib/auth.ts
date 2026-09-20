import { PieceAuth } from '@activepieces/pieces-framework';
import { neuralvergeClient } from './common/client';

export const neuralvergeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your NeuralVerge API key:

1. Sign in at [app.neuralverge.ai](https://app.neuralverge.ai).
2. Open **Settings → API**.
3. Create or copy an API key and paste it here.

Checking the connection runs one email verification call (1 point = $0.001).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await neuralvergeClient.post({
        apiKey: auth,
        endpoint: 'run-email-validation',
        body: { email: 'test@example.com' },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API key. Copy a key from app.neuralverge.ai → Settings → API.',
      };
    }
  },
});
