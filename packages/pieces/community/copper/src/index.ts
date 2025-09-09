import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { CopperAuth } from './lib/common/constants';
import { newPerson } from './lib/triggers/new-person';
import { newLead } from './lib/triggers/new-lead';
import { newTask } from './lib/triggers/new-task';
import { updatedLead } from './lib/triggers/updated-lead';
import { updatedTask } from './lib/triggers/updated-task';
import { updatedOpportunity } from './lib/triggers/updated-opportunity';
import { updatedOpportunityStage } from './lib/triggers/updated-opportunity-stage';
import { updatedOpportunityStatus } from './lib/triggers/updated-opportunity-status';
import { updatedProject } from './lib/triggers/updated-project';
import { updatedLeadStatus } from './lib/triggers/updated-lead-status';
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
import { searchForAnActivity } from './lib/actions/search-for-an-activity';
import { searchForAPerson } from './lib/actions/search-for-a-person';
import { searchForALead } from './lib/actions/search-for-a-lead';
import { searchForACompany } from './lib/actions/search-for-a-company';
import { searchForAnOpportunity } from './lib/actions/search-for-an-opportunity';
import { searchForAProject } from './lib/actions/search-for-a-project';

export const copper = createPiece({
  displayName: 'Copper',
  auth: CopperAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/copper.png',
  authors: ['gs03-dev'],
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
    searchForAnActivity,
    searchForAPerson,
    searchForALead,
    searchForACompany,
    searchForAnOpportunity,
    searchForAProject,
  ],
  triggers: [
    newPerson,
    newLead,
    newTask,
    updatedLead,
    updatedTask,
    updatedOpportunity,
    updatedOpportunityStage,
    updatedOpportunityStatus,
    updatedProject,
    updatedLeadStatus,
  ],
});
