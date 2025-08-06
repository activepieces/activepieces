import { createPiece } from '@activepieces/pieces-framework';
import { sellsyAuth } from './lib/common/auth';

// Import actions
import { createContact } from './lib/actions/create-contact';
import { updateContact } from './lib/actions/update-contact';
import { createCompany } from './lib/actions/create-company';
import { createOpportunity } from './lib/actions/create-opportunity';
import { updateOpportunity } from './lib/actions/update-opportunity';
import { createAnnotation } from './lib/actions/create-annotation';
import { findContact } from './lib/actions/find-contact';
import { findCompany } from './lib/actions/find-company';

// Import triggers
import { newContact } from './lib/triggers/new-contact';
import { contactUpdated } from './lib/triggers/contact-updated';
import { newCompany } from './lib/triggers/new-company';
import { companyUpdated } from './lib/triggers/company-updated';
import { newOpportunity } from './lib/triggers/new-opportunity';
import { opportunityStatusUpdated } from './lib/triggers/opportunity-status-updated';
import { newTask } from './lib/triggers/new-task';
import { taskUpdated } from './lib/triggers/task-updated';

export const sellsy = createPiece({
  displayName: 'Sellsy',
  logoUrl: 'https://cdn.activepieces.com/pieces/sellsy.png',
  auth: sellsyAuth,
  authors: ['saurabhhh777'],
  actions: [
    createContact,
    updateContact,
    createCompany,
    createOpportunity,
    updateOpportunity,
    createAnnotation,
    findContact,
    findCompany,
  ],
  triggers: [
    newContact,
    contactUpdated,
    newCompany,
    companyUpdated,
    newOpportunity,
    opportunityStatusUpdated,
    newTask,
    taskUpdated,
  ],
}); 