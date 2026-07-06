import { PieceAuth, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { makeClient } from './common';

export const APITableAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
    To obtain your AITable token, follow these steps:

    1. Log in to your AITable account.
    2. Visit https://apitable.com/workbench
    3. Click on your profile picture (Bottom left).
    4. Click on "My Settings".
    5. Click on "Developer".
    6. Click on "Generate new token".
    7. Copy the token.
    `,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'Token',
      description: 'The token of the AITable account',
      required: true,
    }),
    apiTableUrl: Property.ShortText({
      displayName: 'Instance Url',
      description: 'The url of the AITable instance.',
      required: true,
      defaultValue: 'https://aitable.ai',
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = makeClient(
        auth as PiecePropValueSchema<typeof APITableAuth>
      );
      await client.listSpaces();
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Token or Instance URL.',
      };
    }
  },
});
