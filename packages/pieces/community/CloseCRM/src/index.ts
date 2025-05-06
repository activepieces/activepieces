import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createLead } from './lib/actions/create-lead';
import { updateDeal } from './lib/actions/update-deal';
import { logEmail } from './lib/actions/log-email';
import { newLeadAdded } from './lib/triggers/new-lead-added';

export const closeAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your Close CRM API key (found in your account settings)'
});

export const closeCrm = createPiece({
  displayName: 'Close CRM',
  description: 'Sales automation and CRM integration for Close',
  logoUrl: 'https://cdn.activepieces.com/pieces/close-Crm.png', 
  authors: ['Ani-4x'],
  auth: closeAuth,
  actions: [
    createLead,
    updateDeal,
    logEmail,
  ],
  triggers: [
    newLeadAdded,
  ],
});