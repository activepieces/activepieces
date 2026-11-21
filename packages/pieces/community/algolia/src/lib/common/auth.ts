import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { tryCatch } from '@activepieces/pieces-framework';

import { validateAlgoliaAuth } from './client';
import { isValidApplicationId } from './utils';

function describeValidationError(message: string): string {
  if (message.includes('(403)')) {
    return 'Algolia rejected the API key: it is invalid for this Application ID or lacks the listIndexes ACL. Use an Admin key or a key with the ACLs listed above.';
  }
  if (message.includes('(401)')) {
    return 'Algolia rejected the credentials. Check the Application ID and API key.';
  }
  if (message.includes('could not get a response')) {
    return 'Could not reach Algolia for this Application ID. Check that the Application ID is correct.';
  }
  return message;
}

export const algoliaAuth = PieceAuth.CustomAuth({
  displayName: 'Connection',
  description: `Authenticate with your Algolia Application ID and API key.

To get your credentials:
1. Sign in to the Algolia dashboard.
2. Open **Settings > API Keys**.
3. Copy your **Application ID**.
4. Copy an API key that can list indexes and manage records.

This piece needs the ACLs listIndexes, search, browse, settings, addObject and deleteObject, plus deleteIndex — only needed if AI agents delete records by filter. Search-only API keys won't work for these actions.`,
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
    if (!isValidApplicationId(auth.applicationId)) {
      return {
        valid: false,
        error: 'Invalid Application ID: it must contain only letters and digits (find it under Settings > API Keys).',
      };
    }

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
        error: describeValidationError(error.message),
      };
    }

    return {
      valid: true,
    };
  },
});
