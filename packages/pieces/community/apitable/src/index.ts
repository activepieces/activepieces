import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRecordAction } from './lib/actions/create-record';
import { findRecordAction } from './lib/actions/find-record';
import { updateRecordAction } from './lib/actions/update-record';
import { newRecordTrigger } from './lib/triggers/new-record';
import { makeClient } from './lib/common';

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
      defaultValue: 'https://api.aitable.ai',
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

export const apitable = createPiece({
  displayName: 'AITable',
  auth: APITableAuth,
  description: `Interactive spreadsheets with collaboration`,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/apitable.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'alerdenisov',
    'Abdallah-Alwarawreh',
    'kishanprmr',
    'MoShizzle',
    'abuaboud',
  ],
  actions: [
    createRecordAction,
    updateRecordAction,
    findRecordAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return (auth as { apiTableUrl: string }).apiTableUrl;
      },
      auth: APITableAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { token: string }).token}`,
      }),
    }),
  ],
  triggers: [newRecordTrigger],
});
