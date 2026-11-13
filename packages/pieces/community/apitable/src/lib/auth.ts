import { PieceAuth, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { makeClient } from './common';

export const APITableAuth = PieceAuth.CustomAuth({
  required: true,
  description:
    'To get your API token:\n1. Sign in to AITable.\n2. Click your avatar at the bottom left, then **My Settings**.\n3. Open **Developer** and click **Generate new token**.\n4. Copy the token and paste it below.',
  props: {
    token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Generate it in AITable under My Settings → Developer.',
      required: true,
    }),
    apiTableUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Keep the default unless you self-host AITable.',
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
