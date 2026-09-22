import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { uploadFile } from './lib/actions/upload-file';
import { createRow } from './lib/actions/create-row';
import { deleteRows } from './lib/actions/delete-rows';
import { updateRow } from './lib/actions/update-row';
import { upsertRow } from './lib/actions/upsert-row';
import { searchRows } from './lib/actions/search-rows';
import { listTables } from './lib/actions/list-tables';
import { getTableSchema } from './lib/actions/get-table-schema';
import { createBucket } from './lib/actions/create-bucket';
import { deleteBucket } from './lib/actions/delete-bucket';
import { listBuckets } from './lib/actions/list-buckets';
import { listFiles } from './lib/actions/list-files';
import { downloadFile } from './lib/actions/download-file';
import { deleteFile } from './lib/actions/delete-file';
import { createSignedUrl } from './lib/actions/create-signed-url';
import { listUsers } from './lib/actions/list-users';
import { getUser } from './lib/actions/get-user';
import { createUser } from './lib/actions/create-user';
import { updateUser } from './lib/actions/update-user';
import { deleteUser } from './lib/actions/delete-user';
import { inviteUser } from './lib/actions/invite-user';
import { newRow } from './lib/triggers/new-row';
import { supabaseAuth } from './lib/auth';

export const supabase = createPiece({
  displayName: 'Supabase',
  description: 'The open-source Firebase alternative',
  auth: supabaseAuth,
  minimumSupportedRelease: '0.87.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/supabase.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["kishanprmr","MoShizzle","abuaboud","fortunamide"],
  actions: [
    uploadFile,
    createRow,
    updateRow,
    upsertRow,
    deleteRows,
    searchRows,
    listTables,
    getTableSchema,
    createBucket,
    deleteBucket,
    listBuckets,
    listFiles,
    downloadFile,
    deleteFile,
    createSignedUrl,
    listUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    inviteUser,
    createCustomApiCallAction({
      baseUrl: (auth) => auth?.props?.url || '',
      auth: supabaseAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.apiKey}`,
      }),
    }),
  ],
  triggers: [
    newRow,
  ],
});
