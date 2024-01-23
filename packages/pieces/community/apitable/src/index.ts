import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { ApiTableNewRecord } from './lib/triggers/new-record';
import { apiTableCreateRecord } from './lib/actions/create-record';
import { apiTableUpdateRecord } from './lib/actions/update-record';
import { apiTableFindRecord } from './lib/actions/find-record';

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
      description: 'The token of the APITable account',
      required: true,
    }),
    apiTableUrl: Property.ShortText({
      displayName: 'Instance Url',
      description: 'The url of the APITable instance.',
      required: true,
      defaultValue: 'https://api.aitable.ai',
    }),
  },
});

export const apitable = createPiece({
  displayName: 'AITable',
  auth: APITableAuth,
  description: `Interactive spreadsheets with collaboration`,
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/apitable.png',
  authors: ['abdallah-alwarawreh', 'kishanprmr'],
  actions: [apiTableCreateRecord, apiTableUpdateRecord, apiTableFindRecord],
  triggers: [ApiTableNewRecord],
});
