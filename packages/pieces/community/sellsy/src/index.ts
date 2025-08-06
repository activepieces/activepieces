import { createPiece } from '@activepieces/pieces-framework';
import { sellsyAuth } from './lib/common/auth';
import { createContact } from './lib/actions/create-contact';
import { createCompany } from './lib/actions/create-company';
import { createAnnotation } from './lib/actions/create-annotation';
import { createOpportunity } from './lib/actions/create-opportunity';
import { findContact } from './lib/actions/find-contact';
import { findCompany } from './lib/actions/find-company';
import { updateContact } from './lib/actions/update-contact';
import { updateOpportunity } from './lib/actions/update-opportunity';
import { newContact } from './lib/triggers/new-contact';
import { newCompany } from './lib/triggers/new-company';
import { newOpportunity } from './lib/triggers/new-opportunity';
import { newTask } from './lib/triggers/new-task';
import { updatedCompany } from './lib/triggers/updated-company';
import { updatedContact } from './lib/triggers/updated-contact';
import { updatedOpportunityStatus } from './lib/triggers/updated-opportunity-status';
import { updatedTask } from './lib/triggers/updated-task';

export const sellsy = createPiece({
  displayName: 'Sellsy',
  auth: sellsyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sellsy.png',
  authors: [],
  actions: [
    createContact,
    createCompany,
    createAnnotation,
    createOpportunity,
    findContact,
    findCompany,
    updateContact,
    updateOpportunity,
  ],
  triggers: [
    newContact,
    newCompany,
    newOpportunity,
    newTask,
    updatedCompany,
    updatedContact,
    updatedOpportunityStatus,
    updatedTask

  ],
});
