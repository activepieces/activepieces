import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { capsuleCrmAuth } from './lib/common';

// Import triggers
import { newCaseTrigger } from './lib/triggers/new-case';
import { newOpportunityTrigger } from './lib/triggers/new-opportunity';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newProjectTrigger } from './lib/triggers/new-project';

// Import write actions
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { createOpportunityAction } from './lib/actions/create-opportunity';
import { updateOpportunityAction } from './lib/actions/update-opportunity';
import { createProjectAction } from './lib/actions/create-project';
import { createTaskAction } from './lib/actions/create-task';
import { addNoteToEntityAction } from './lib/actions/add-note-to-entity';

// Import search actions
import { findContactAction } from './lib/actions/find-contact';
import { findProjectAction } from './lib/actions/find-project';
import { findOpportunityAction } from './lib/actions/find-opportunity';

export const capsuleCrm = createPiece({
  displayName: 'Capsule CRM',
  description: 'Cloud-based customer relationship management tool for managing contacts, sales opportunities, tasks, cases, and projects.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/capsule-crm.png',
  authors: ['activepieces'],
  categories: [PieceCategory.SALES_AND_CRM],
  auth: capsuleCrmAuth,
  actions: [
    createContactAction,
    updateContactAction,
    createOpportunityAction,
    updateOpportunityAction,
    createProjectAction,
    createTaskAction,
    addNoteToEntityAction,
    findContactAction,
    findProjectAction,
    findOpportunityAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.capsulecrm.com/api/v2',
      auth: capsuleCrmAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as any).token}`,
      }),
    }),
  ],
  triggers: [
    newCaseTrigger,
    newOpportunityTrigger,
    newTaskTrigger,
    newProjectTrigger,
  ],
});