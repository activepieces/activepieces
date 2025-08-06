import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { uploadFile } from './lib/actions/upload-file';
import { createRow } from './lib/actions/create-row';
import { deleteRows } from './lib/actions/delete-rows';
import { updateRow } from './lib/actions/update-row';
import { upsertRow } from './lib/actions/upsert-row';
import { searchRows } from './lib/actions/search-rows';
import { newRow } from './lib/triggers/new-row';

const markdown = `
Copy the **URL** and **Service API Key** from your Supabase project settings.
`;
export const supabaseAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});
export const supabase = createPiece({
  displayName: 'Supabase',
  description: 'The open-source Firebase alternative',
  auth: supabaseAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/supabase.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    uploadFile,
    createRow,
    deleteRows,
    updateRow,
    upsertRow,
    searchRows,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { url: string }).url,
      auth: supabaseAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { apiKey: string }).apiKey}`,
      }),
    }),
  ],
  triggers: [
    newRow,
  ],
});
