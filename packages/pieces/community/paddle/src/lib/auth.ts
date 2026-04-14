import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { paddleClient } from './common/client';

const paddleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Authenticate with a Paddle API key.

Live and sandbox keys are supported automatically.

You can create API keys from **Developer Tools > Authentication** in the Paddle dashboard.`,
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      paddleClient.validateAuth({
        apiKey: auth,
      }),
    );

    if (error) {
      return {
        valid: false,
        error: 'Invalid API key. Check the key and try again.',
      };
    }

    return {
      valid: true,
    };
  },
});

type PaddleAuthType = AppConnectionValueForAuthProperty<typeof paddleAuth>;

export { paddleAuth };
export type { PaddleAuthType };
