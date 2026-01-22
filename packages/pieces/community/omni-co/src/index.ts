import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { omniAuth } from './lib/common/auth';
import { createADocument } from './lib/actions/create-a-document';
import { createASchedule } from './lib/actions/create-a-schedule';
import { deleteADocument } from './lib/actions/delete-a-document';
import { deleteASchedule } from './lib/actions/delete-a-schedule';
import { moveDocument } from './lib/actions/move-document';
import { runQuery } from './lib/actions/run-query';
import { editSchedule } from './lib/actions/edit-schedule';
import { generateQuery } from './lib/actions/generate-query';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const omniCo = createPiece({
  displayName: 'Omni',
  auth: omniAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/omni-co.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [
    createADocument,
    createASchedule,
    deleteADocument,
    deleteASchedule,
    editSchedule,
    generateQuery,
    moveDocument,
    runQuery,
    createCustomApiCallAction({
      baseUrl: () => 'https://blobsrus.omniapp.co/api/v1',
      auth: omniAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
