import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createContactAction } from './lib/actions/accounts/create-contact';
import { createOrganizationAction } from './lib/actions/accounts/create-organization';
import { deleteContactAction } from './lib/actions/accounts/delete-contact';
import { findAccountsAction } from './lib/actions/accounts/find-accounts';
import { getAccountAction } from './lib/actions/accounts/get-account';
import { updateContactAction } from './lib/actions/accounts/update-contact';
import { updateOrganizationAction } from './lib/actions/accounts/update-organization';
import { flowluAccountCreate } from './lib/actions/ai/account-create';
import { flowluAccountDelete } from './lib/actions/ai/account-delete';
import { flowluAccountUpdate } from './lib/actions/ai/account-update';
import { flowluOpportunityCreate } from './lib/actions/ai/opportunity-create';
import { flowluOpportunityDelete } from './lib/actions/ai/opportunity-delete';
import { flowluOpportunityUpdate } from './lib/actions/ai/opportunity-update';
import { flowluProjectCreate } from './lib/actions/ai/project-create';
import { flowluProjectUpdate } from './lib/actions/ai/project-update';
import { flowluTaskCreate } from './lib/actions/ai/task-create';
import { flowluTaskDelete } from './lib/actions/ai/task-delete';
import { flowluTaskGet } from './lib/actions/ai/task-get';
import { flowluTaskUpdate } from './lib/actions/ai/task-update';
import { listLookupValuesAction } from './lib/actions/lookups/list-lookup-values';
import { listUsersAction } from './lib/actions/lookups/list-users';
import { createOpportunityAction } from './lib/actions/opportunities/create-opportunity';
import { deleteOpportunityAction } from './lib/actions/opportunities/delete-opportunity';
import { findOpportunitiesAction } from './lib/actions/opportunities/find-opportunities';
import { getOpportunityAction } from './lib/actions/opportunities/get-opportunity';
import { linkAccountToOpportunityAction } from './lib/actions/opportunities/link-account-to-opportunity';
import { updateOpportunityAction } from './lib/actions/opportunities/update-opportunity';
import { createProjectAction } from './lib/actions/projects/create-project';
import { findProjectsAction } from './lib/actions/projects/find-projects';
import { getProjectAction } from './lib/actions/projects/get-project';
import { updateProjectAction } from './lib/actions/projects/update-project';
import { createTaskAction } from './lib/actions/tasks/create-task';
import { deleteTaskAction } from './lib/actions/tasks/delete-task';
import { findTasksAction } from './lib/actions/tasks/find-tasks';
import { getTaskAction } from './lib/actions/tasks/get-task';
import { updateTaskAction } from './lib/actions/tasks/update-task';
import { flowluAuth } from './lib/auth';
import { newCrmAccountTrigger } from './lib/triggers/new-crm-account';
import { newOpportunityTrigger } from './lib/triggers/new-opportunity';
import { newProjectTrigger } from './lib/triggers/new-project';
import { newTaskTrigger } from './lib/triggers/new-task';

export const flowlu = createPiece({
  displayName: 'Flowlu',
  description: 'Business management software',
  auth: flowluAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/flowlu.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['kishanprmr', 'abuaboud'],
  actions: [
    createContactAction,
    updateContactAction,
    deleteContactAction,
    createOrganizationAction,
    updateOrganizationAction,
    getAccountAction,
    findAccountsAction,
    createOpportunityAction,
    updateOpportunityAction,
    deleteOpportunityAction,
    getOpportunityAction,
    findOpportunitiesAction,
    linkAccountToOpportunityAction,
    createTaskAction,
    updateTaskAction,
    getTaskAction,
    deleteTaskAction,
    findTasksAction,
    createProjectAction,
    updateProjectAction,
    getProjectAction,
    findProjectsAction,
    listUsersAction,
    listLookupValuesAction,
    flowluAccountCreate,
    flowluAccountUpdate,
    flowluAccountDelete,
    flowluOpportunityCreate,
    flowluOpportunityUpdate,
    flowluOpportunityDelete,
    flowluTaskCreate,
    flowluTaskUpdate,
    flowluTaskGet,
    flowluTaskDelete,
    flowluProjectCreate,
    flowluProjectUpdate,
  ],
  triggers: [
    newTaskTrigger,
    newOpportunityTrigger,
    newCrmAccountTrigger,
    newProjectTrigger,
  ],
});
