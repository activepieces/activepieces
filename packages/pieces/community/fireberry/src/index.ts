import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { fireberryAuth } from './lib/common/auth';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { getRecordByIdAction } from './lib/actions/get-record-by-id';
import { updateRecordAction } from './lib/actions/update-record';
import { newOrUpdatedRecordTrigger } from './lib/triggers/new-or-updated-record-trigger';


export const fireberry = createPiece({
  displayName: 'fireberry (Fireberry)',
  auth: fireberryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: ' https://cdn.activepieces.com/pieces/fireberry.png',
  authors: ['krushnarout'],
  actions: [
    createRecordAction,
    deleteRecordAction,
    getRecordByIdAction,
    updateRecordAction,
    createCustomApiCallAction({
      auth: fireberryAuth,
      baseUrl: () => 'https://api.fireberry.com/api',
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          Authorization: `Bearer ${apiKey}`,
        };
      },
    }),
  ],
  triggers: [newOrUpdatedRecordTrigger],
});
