import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from './lib/auth';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { getFullListAction } from './lib/actions/get-full-list';
import { getListAction } from './lib/actions/get-list';
import { getRecordAction } from './lib/actions/get-record';
import { updateRecordAction } from './lib/actions/update-record';
import { pocketbaseAiActions } from './lib/actions/ai';
import { pocketbaseClient } from './lib/common/client';

export const pocketbase = createPiece({
  displayName: 'Pocketbase',
  description: 'Interact with your PocketBase instance using superuser credentials.',
  auth: pocketbaseAuth,
  categories: [PieceCategory.DEVELOPER_TOOLS],
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/pocketbase.png',
  authors: ['anasaijaz'],
  actions: [
    getFullListAction,
    getListAction,
    getRecordAction,
    createRecordAction,
    updateRecordAction,
    deleteRecordAction,
    ...pocketbaseAiActions,
    createCustomApiCallAction({
      auth: pocketbaseAuth,
      baseUrl: (auth) => (auth ? pocketbaseClient.baseUrl({ auth }) : ''),
      authMapping: async (auth) => ({ Authorization: `Bearer ${await pocketbaseClient.getToken({ auth })}` }),
    }),
  ],
  triggers: [],
});
