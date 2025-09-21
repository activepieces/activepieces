import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import triggers
import { newCasesTrigger } from './lib/triggers/new-cases';
import { newOpportunitiesTrigger } from './lib/triggers/new-opportunities';
import { newTasksTrigger } from './lib/triggers/new-tasks';
import { newProjectsTrigger } from './lib/triggers/new-projects';

// Import actions
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { createOpportunityAction } from './lib/actions/create-opportunity';
import { updateOpportunityAction } from './lib/actions/update-opportunity';
import { createProjectAction } from './lib/actions/create-project';
import { createTaskAction } from './lib/actions/create-task';
import { addNoteAction } from './lib/actions/add-note';
import { findContactAction } from './lib/actions/find-contact';
import { findProjectAction } from './lib/actions/find-project';
import { findOpportunityAction } from './lib/actions/find-opportunity';

export const capsuleCrmAuth = PieceAuth.OAuth2({
  description: 'Authentication for Capsule CRM',
  authUrl: 'https://api.capsulecrm.com/oauth/authorise',
  tokenUrl: 'https://api.capsulecrm.com/oauth/token',
  required: true,
  scope: ['read', 'write'],
});

export const capsuleCrm = createPiece({
  displayName: 'Capsule CRM',
  description: 'Cloud CRM tool for managing contacts, opportunities, tasks, cases, and projects',
  
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/capsule.png',
  categories: [PieceCategory.SALES_AND_CRM],
  auth: capsuleCrmAuth,
  authors: ["uvenkatateja"],
  
  actions: [
    createContactAction,
    updateContactAction,
    createOpportunityAction,
    updateOpportunityAction,
    createProjectAction,
    createTaskAction,
    addNoteAction,
    findContactAction,
    findProjectAction,
    findOpportunityAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.capsulecrm.com',
      auth: capsuleCrmAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as any).access_token}`,
      }),
    }),
  ],
  
  triggers: [
    newCasesTrigger,
    newOpportunitiesTrigger,
    newTasksTrigger,
    newProjectsTrigger,
  ],
});
