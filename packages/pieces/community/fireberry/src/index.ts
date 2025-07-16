import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { fireberryAuth } from './lib/common/auth';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { findRecordAction } from './lib/actions/find-record';
import { updateRecordAction } from './lib/actions/update-record';
import { newOrUpdatedRecordTrigger } from './lib/triggers/new-or-updated-record-trigger';

export const fireberry = createPiece({
  displayName: 'Fireberry',
  auth: fireberryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: ' https://cdn.activepieces.com/pieces/fireberry.png',
  authors: ['krushnarout'],
  actions: [
    createRecordAction,
    deleteRecordAction,
    findRecordAction,
    updateRecordAction,
    createCustomApiCallAction({
      auth: fireberryAuth,
      baseUrl: () => 'https://api.fireberry.com/api',
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          tokenid: apiKey,
        };
      },
    }),
  ],
  triggers: [newOrUpdatedRecordTrigger],
});
