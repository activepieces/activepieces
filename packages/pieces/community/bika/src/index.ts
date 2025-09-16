import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRecordAction } from './lib/actions/create-record';
import { findRecordsAction } from './lib/actions/find-records';
import { findRecordAction} from './lib/actions/find-record';
import {deleteRecordAction } from './lib/actions/delete-record';
import { updateRecordAction } from './lib/actions/update-record';
import { makeClient } from './lib/common';

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

export const bika = createPiece({
  displayName: 'Bika.ai',
  auth: BikaAuth,
  description: `Interactive spreadsheets with collaboration`,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bika.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: [
    'codegino'
  ],
  actions: [
    createRecordAction,
    findRecordsAction,
    findRecordAction,
    updateRecordAction,
    deleteRecordAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://bika.ai/api/openapi/bika',
      auth: BikaAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { token: string }).token}`,
      }),
    }),
  ],
  triggers: [],
});
