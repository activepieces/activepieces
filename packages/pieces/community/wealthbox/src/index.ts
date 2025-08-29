import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { wealthboxAuth } from './lib/common/auth';

// Import triggers
import { newTask } from './lib/triggers/new-task';
import { newContact } from './lib/triggers/new-contact';
import { newEvent } from './lib/triggers/new-event';
import { newOpportunity } from './lib/triggers/new-opportunity';

// Import actions
import { createContact } from './lib/actions/create-contact';
import { createNote } from './lib/actions/create-note';
import { createProject } from './lib/actions/create-project';
import { createHousehold } from './lib/actions/create-household';
import { addMemberToHousehold } from './lib/actions/add-member-to-household';
import { createEvent } from './lib/actions/create-event';
import { createOpportunity } from './lib/actions/create-opportunity';
import { createTask } from './lib/actions/create-task';
import { startWorkflow } from './lib/actions/start-workflow';

// Import search actions
import { findContact } from './lib/actions/find-contact';
import { findTask } from './lib/actions/find-task';

export const wealthbox = createPiece({
  displayName: 'Wealthbox CRM',
  description: 'Wealthbox CRM is a modern, easy-to-use CRM tailored for financial advisors. This piece allows AI-driven workflows to trigger on key CRM events and manage entities, everything from contact creation to starting custom workflows.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/wealthbox.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['kishanprmr'],
  auth: wealthboxAuth,
  actions: [
    createContact,
    createNote,
    createProject,
    createHousehold,
    addMemberToHousehold,
    createEvent,
    createOpportunity,
    createTask,
    startWorkflow,
    findContact,
    findTask,
  ],
  triggers: [
    newTask,
    newContact,
    newEvent,
    newOpportunity,
  ],
}); 