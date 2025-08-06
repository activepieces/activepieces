import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { uploadFile } from './lib/actions/upload-file';
import { createClient } from '@supabase/supabase-js';
import { createRowAction } from './lib/actions/create-row';
import { deleteRowsAction } from './lib/actions/delete-row';
import { searchRowsAction } from './lib/actions/search-rows';
import { updateRowAction } from './lib/actions/update-row';
import { upsertRowAction } from './lib/actions/upsert-row';
import { newRowTrigger } from './lib/triggers/new-row';

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
    createRowAction,
    deleteRowsAction,
    searchRowsAction,
    updateRowAction,
    upsertRowAction,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth as { url: string }).url,
      auth: supabaseAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { apiKey: string }).apiKey}`,
      }),
    }),
  ],
  triggers: [
    newRowTrigger
  ],
});

export function createSupabaseClient(auth: any) {
  return createClient(auth.url, auth.apiKey);
}
