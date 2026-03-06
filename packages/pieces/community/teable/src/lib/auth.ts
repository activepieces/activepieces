import { PieceAuth, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { makeClient } from './common';

export const TeableAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
    To obtain your Teable Personal Access Token:

    1. Log in to your Teable account at https://app.teable.ai.
    2. Click on your profile icon (top-right corner).
    3. Go to "Settings" > "Personal Access Token".
    4. Click "New Token", set a name and the required scopes.
    5. Copy and save the generated token.

    For self-hosted instances, set the Base URL to your own domain.
    `,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'Personal Access Token',
      description: 'Your Teable personal access token',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description:
        'Teable Cloud: https://app.teable.ai — for self-hosted, enter your own domain.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(
        auth as PiecePropValueSchema<typeof TeableAuth>
      );
      await client.listBases();
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Token.',
      };
    }
  },
});
