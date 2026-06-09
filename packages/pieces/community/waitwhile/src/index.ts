import { createPiece } from '@activepieces/pieces-framework';
import { waitwhileAuth } from './lib/common/auth';
import { createACustomer } from './lib/actions/create-a-customer';
import { createOrUpdateAVisit } from './lib/actions/create-or-update-a-visit';
import { deleteAVisit } from './lib/actions/delete-a-visit';
import { searchCustomers } from './lib/actions/search-customers';
import { newOrUpdatedMessage } from './lib/triggers/new-or-updated-message';
import { newOrUpdatedVisit } from './lib/triggers/new-or-updated-visit';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const waitwhile = createPiece({
  displayName: 'WaitWhile',
  auth: waitwhileAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/waitwhile.png',
  description:
    'WaitWhile is an appointment scheduling and queue management platform.',
  categories: [PieceCategory.COMMERCE],
  authors: ['sanket-a11y'],
  actions: [
    createACustomer,
    createOrUpdateAVisit,
    deleteAVisit,
    searchCustomers,
    createCustomApiCallAction({
      auth: waitwhileAuth,
      baseUrl: () => `https://api.waitwhile.com/v2`,
      authMapping: async (auth) => {
        return {
          apikey: auth.secret_text,
        };
      },
    }),
  ],
  triggers: [newOrUpdatedMessage, newOrUpdatedVisit],
});
