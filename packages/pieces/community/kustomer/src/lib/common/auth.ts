import { PieceAuth } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { kustomerClient } from './client';
import { kustomerUtils } from './utils';

export const kustomerAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `Authenticate using a Kustomer API token.

Paste a private Kustomer API token with access to customers, conversations, and KObjects.`,
  required: true,
  validate: async ({ auth }) => {
    const apiKey = kustomerUtils.parseOptionalAuthToken({
      value: auth,
    });

    if (!apiKey) {
      return {
        valid: false,
        error: 'Invalid API token.',
      };
    }

    const { error } = await tryCatch(() =>
      kustomerClient.validateAuth({
        apiKey,
      }),
    );

    if (error) {
      return {
        valid: false,
        error: 'Invalid API token or missing Kustomer permissions.',
      };
    }

    return {
      valid: true,
    };
  },
});
