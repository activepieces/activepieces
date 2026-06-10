import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createLead } from './lib/actions/create-lead';
import { findLead } from './lib/actions/find-lead';
import { newLeadAdded } from './lib/triggers/new-lead-added';
import { createOpportunity } from './lib/actions/create-opportunity';
import { createContact } from './lib/actions/create-contact';
import { newContactAdded } from './lib/triggers/new-contact-added';
import { findContact } from './lib/actions/find-contact';
import { CLOSE_API_URL, closeApiCall } from './lib/common/client';
import { newOpportunityAdded } from './lib/triggers/new-opportunity';
import { closeAuth } from './lib/auth';

export const close = createPiece({
  displayName: 'Close',
  description: 'Sales automation and CRM integration for Close',
  auth: closeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/close.png',
  authors: ['Ani-4x', 'kishanprmr'],
  actions: [
    createLead,
    createContact,
    findLead,
    createOpportunity,
    findContact,
    createCustomApiCallAction({
      baseUrl: () => CLOSE_API_URL,
      auth: closeAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Basic ${Buffer.from(`${auth}:`).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [newLeadAdded, newContactAdded, newOpportunityAdded],
});
