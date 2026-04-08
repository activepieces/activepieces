import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/shared';

import { validateAlgoliaAuth } from './client';

export const algoliaAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description: `Authenticate with your Algolia Application ID and API key.

To get your credentials:
1. Sign in to the Algolia dashboard.
2. Open **Settings > API Keys**.
3. Copy your **Application ID**.
4. Copy an API key that can list indexes and manage records.

This piece needs permissions for \`listIndexes\`, \`browse\`, \`addObject\`, and \`deleteObject\`. Search-only API keys won't work for these actions.`,
  required: true,
  props: {
    applicationId: Property.ShortText({
      displayName: 'Application ID',
      description: 'Your Algolia application ID.',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'An Algolia API key with index browsing and record write permissions.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      validateAlgoliaAuth({
        props: {
          applicationId: auth.applicationId,
          apiKey: auth.apiKey,
        },
      }),
    );

    if (error) {
      return {
        valid: false,
        error:
          'Invalid Algolia credentials or missing required index permissions.',
      };
    }

    return {
      valid: true,
    };
  },
});
