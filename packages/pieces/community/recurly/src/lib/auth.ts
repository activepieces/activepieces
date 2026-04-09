import { AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';
import { Client } from 'recurly';

export const recurlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain API key from [Developer Settings](https://app.recurly.com/go/developer/api_keys).`,
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      new Client(auth).listSites().first(),
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

export type RecurlyAuthType = AppConnectionValueForAuthProperty<typeof recurlyAuth>
