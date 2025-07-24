import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { hunterIoAuth } from './lib/common/auth';
import { addRecipientsAction } from './lib/actions/add-recipients';
import { countEmailsAction } from './lib/actions/count-emails';
import { createLeadAction } from './lib/actions/create-lead';
import { deleteLeadAction } from './lib/actions/delete-lead';
import { findEmailAction } from './lib/actions/find-emai';
import { getLeadAction } from './lib/actions/get-lead';
import { searchLeadsAction } from './lib/actions/search-leads';
import { updateLeadAction } from './lib/actions/update-lead';
import { verifyEmailAction } from './lib/actions/verify-email';
import { newLeadCreatedTrigger } from './lib/triggers/new-lead';

export const hunterIo = createPiece({
  displayName: 'Hunter',
  auth: hunterIoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hunter.png',
  authors: ['activepieces-community'],
  actions: [
    addRecipientsAction,
    countEmailsAction,
    createLeadAction,
    deleteLeadAction,
    findEmailAction,
    getLeadAction,
    searchLeadsAction,
    updateLeadAction,
    verifyEmailAction,
    createCustomApiCallAction({
      auth: hunterIoAuth,
      baseUrl: () => 'https://api.hunter.io/v2',
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          api_key: apiKey,
        };
      },
    }),
  ],
  triggers: [ newLeadCreatedTrigger ],
});
