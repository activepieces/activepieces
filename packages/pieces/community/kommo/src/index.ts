import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { kommoAuth } from './lib/auth';

// Import actions
import { findLead } from './lib/actions/find-lead';
import { findContact } from './lib/actions/find-contact';
import { findCompany } from './lib/actions/find-company';
import { createLead } from './lib/actions/create-lead';
import { updateLead } from './lib/actions/update-lead';
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';

// Import triggers
import { newLeadTrigger } from './lib/triggers/new-lead';
import { leadStatusChangedTrigger } from './lib/triggers/lead-status';
import { newContactTrigger } from './lib/triggers/new-contact';
import { taskCompletedTrigger } from './lib/triggers/task-completed';

export const kommo = createPiece({
  displayName: 'Kommo',
  description: 'CRM platform for managing leads, contacts, tasks, and communications',
  logoUrl: 'https://cdn.activepieces.com/pieces/kommo-crm.png',
  categories: [PieceCategory.SALES_AND_CRM],
  auth: kommoAuth,
  minimumSupportedRelease: '0.30.0',
  authors: ['activepieces-community'],
  actions: [
    // Search actions
    findLead,
    findContact,
    findCompany,

    // Write actions
    createLead,
    updateLead,
    createContact,
    updateContact,
  ],
  triggers: [
    newLeadTrigger,
    leadStatusChangedTrigger,
    newContactTrigger,
    taskCompletedTrigger,
  ],
});
