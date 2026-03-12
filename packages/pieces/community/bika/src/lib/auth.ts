import { PieceAuth, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { makeClient } from './common';

export const BikaAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
    To obtain your Bika token, follow these steps:

    1. Log in to your Bika account.
    2. Visit https://bika.com.
    3. Click on your profile picture (Bottom left).
    4. Click on "My Settings".
    5. Click on "Developer".
    6. Click on "Generate new token".
    7. Copy the token.
    `,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'Token',
      description: 'The token of the Bika account',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(
        auth as PiecePropValueSchema<typeof BikaAuth>
      );
      await client.listSpaces();
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
