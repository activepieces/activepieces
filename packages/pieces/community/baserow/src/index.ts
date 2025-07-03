import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createRowAction } from './lib/actions/create-row';
import { deleteRowAction } from './lib/actions/delete-row';
import { getRowAction } from './lib/actions/get-row';
import { listRowsAction } from './lib/actions/list-rows';
import { updateRowAction } from './lib/actions/update-row';

export const baserowAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  1. Log in to your Baserow Account.
  2. Click on your profile-pic(top-left) and navigate to **Settings->Database tokens**.
  3. Create new token with any name and appropriate workspace.
  4. After token creation,click on **:** right beside token name and copy database token.
  5. Enter your Baserow API URL.If you are using baserow.io, you can leave the default one.`,
  props: {
    apiUrl: Property.ShortText({
      displayName: 'API URL',
      required: true,
      defaultValue: 'https://api.baserow.io',
    }),
    token: PieceAuth.SecretText({
      displayName: 'Database Token',
      required: true,
    }),
  },
});

export const baserow = createPiece({
  displayName: 'Baserow',
  description: 'Open-source online database tool, alternative to Airtable',
  auth: baserowAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/baserow.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createRowAction,
    deleteRowAction,
    getRowAction,
    listRowsAction,
    updateRowAction,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return (auth as { apiUrl: string }).apiUrl;
      },
      auth: baserowAuth,
      authMapping: async (auth) => ({
        Authorization: `Token ${(auth as { token: string }).token}`,
      }),
    }),
  ],
  triggers: [],
});
