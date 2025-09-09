import { createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { copperAuth } from './lib/common/auth';
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
import { searchForActivity } from './lib/actions/search-for-an-activity';
import { searchPerson } from './lib/actions/search-for-a-person';
import { searchLead } from './lib/actions/search-for-a-lead';
import { searchCompany } from './lib/actions/search-for-a-company';
import { searchOpportunity } from './lib/actions/search-for-a-opportunity';
import { searchProject } from './lib/actions/search-for-a-project';
import { newActivity } from './lib/triggers/new-activity';
import { newPerson } from './lib/triggers/new-person';
import { newLead } from './lib/triggers/new-lead';
import { newTask } from './lib/triggers/new-task';
import { updatedLead } from './lib/triggers/updated-lead';
import { updatedTask } from './lib/triggers/updated-task';
import { updatedOpportunity } from './lib/triggers/updated-opportunity';
import { updatedOpportunityStatus } from './lib/triggers/updated-opportunity-status';
import { updatedOpportunityStage } from './lib/triggers/updated-opportunity-stage';
import { updatedProject } from './lib/triggers/updated-project';
import { updatedLeadStatus } from './lib/triggers/updated-lead-status';

export const copper = createPiece({
  displayName: "Copper",
  description: "CRM and sales pipeline management platform",
  auth: copperAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/copper.png",
  authors: [],
  actions: [
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
    searchForActivity,
    searchPerson,
    searchLead,
    searchCompany,
    searchOpportunity,
    searchProject,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.copper.com/developer_api/v1',
      auth: copperAuth,
      authMapping: async (auth) => ({
        'X-PW-AccessToken': auth.apiKey as string,
        'X-PW-Application': 'developer_api',
        'X-PW-UserEmail': auth.userEmail as string,
        'Content-Type': 'application/json',
      }),
    }),
  ],
  triggers: [
    newActivity,
    newPerson,
    newLead,
    newTask,
    updatedLead,
    updatedTask,
    updatedOpportunity,
    updatedOpportunityStatus,
    updatedOpportunityStage,
    updatedProject,
    updatedLeadStatus,
  ],
});
