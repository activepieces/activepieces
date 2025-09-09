import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { copperAuth } from './lib/common/auth';

// Write Actions
import { createPerson } from './lib/actions/create-person';
import { updatePerson } from './lib/actions/update-person';
import { createLead } from './lib/actions/create-lead';
import { updateLead } from './lib/actions/update-lead';
import { convertLead } from './lib/actions/convert-lead';
import { createCompany } from './lib/actions/create-company';
import { updateCompany } from './lib/actions/update-company';
import { createOpportunity } from './lib/actions/create-opportunity';
import { updateOpportunity } from './lib/actions/update-opportunity';
import { createProject } from './lib/actions/create-project';
import { updateProject } from './lib/actions/update-project';
import { createTask } from './lib/actions/create-task';
import { createActivity } from './lib/actions/create-activity';

// Search Actions
import { searchPerson } from './lib/actions/search-person';
import { searchLead } from './lib/actions/search-lead';
import { searchCompany } from './lib/actions/search-company';
import { searchOpportunity } from './lib/actions/search-opportunity';
import { searchProject } from './lib/actions/search-project';
import { searchActivity } from './lib/actions/search-activity';

// Triggers
import { newPersonTrigger } from './lib/triggers/new-person';
import { newLeadTrigger } from './lib/triggers/new-lead';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newActivityTrigger } from './lib/triggers/new-activity';
import { updatedLeadTrigger } from './lib/triggers/updated-lead';
import { updatedTaskTrigger } from './lib/triggers/updated-task';
import { updatedOpportunityTrigger } from './lib/triggers/updated-opportunity';
import { updatedProjectTrigger } from './lib/triggers/updated-project';

export const copper = createPiece({
  displayName: 'Copper',
  description:
    'Copper is a CRM for Google Workspace. Automate contacts, leads, opportunities, projects, tasks, and activities.',
  auth: copperAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/copper.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['gpt-5-assistant'],
  actions: [
    // Write Actions
    createPerson,
    updatePerson,
    createLead,
    updateLead,
    convertLead,
    createCompany,
    updateCompany,
    createOpportunity,
    updateOpportunity,
    createProject,
    updateProject,
    createTask,
    createActivity,
    
    // Search Actions
    searchPerson,
    searchLead,
    searchCompany,
    searchOpportunity,
    searchProject,
    searchActivity,
    
    createCustomApiCallAction({
      auth: copperAuth,
      baseUrl: () => 'https://api.copper.com/developer_api/v1',
      authMapping: async (auth) => {
        const a = auth as { api_key: string; email: string };
        return {
          'X-PW-AccessToken': a.api_key,
          'X-PW-UserEmail': a.email,
          'X-PW-Application': 'developer_api',
        };
      },
    }),
  ],
  triggers: [
    newPersonTrigger,
    newLeadTrigger,
    newTaskTrigger,
    newActivityTrigger,
    updatedLeadTrigger,
    updatedTaskTrigger,
    updatedOpportunityTrigger,
    updatedProjectTrigger,
  ],
});

export default copper;

