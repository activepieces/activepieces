import { createPiece } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from './lib/common/auth';
import { createContactAction } from './lib/actions/create-contact';
import { updateContactAction } from './lib/actions/update-contact';
import { createOpportunityAction } from './lib/actions/create-opportunity';
import { createProjectAction } from './lib/actions/create-project';
import { createTaskAction } from './lib/actions/create-task';
import { updateOpportunityAction } from './lib/actions/update-opportunity';
import { addNoteToEntityAction } from './lib/actions/add-note-to-entity';
import { findContactAction } from './lib/actions/find-contact';
import { findProjectAction } from './lib/actions/find-project';
import { findOpportunityAction } from './lib/actions/find-opportunity';
import { aiAddNote } from './lib/actions/ai/ai-add-note';
import { aiCompleteTask } from './lib/actions/ai/ai-complete-task';
import { aiCreateOpportunity } from './lib/actions/ai/ai-create-opportunity';
import { aiCreateOrganisation } from './lib/actions/ai/ai-create-organisation';
import { aiCreatePerson } from './lib/actions/ai/ai-create-person';
import { aiCreateProject } from './lib/actions/ai/ai-create-project';
import { aiCreateTask } from './lib/actions/ai/ai-create-task';
import { aiDeleteParty } from './lib/actions/ai/ai-delete-party';
import { aiGetOpportunity } from './lib/actions/ai/ai-get-opportunity';
import { aiGetParty } from './lib/actions/ai/ai-get-party';
import { aiGetProject } from './lib/actions/ai/ai-get-project';
import { aiListEntries } from './lib/actions/ai/ai-list-entries';
import { aiListMilestones } from './lib/actions/ai/ai-list-milestones';
import { aiListStages } from './lib/actions/ai/ai-list-stages';
import { aiListTasks } from './lib/actions/ai/ai-list-tasks';
import { aiListUsers } from './lib/actions/ai/ai-list-users';
import { aiSearchOpportunities } from './lib/actions/ai/ai-search-opportunities';
import { aiSearchParties } from './lib/actions/ai/ai-search-parties';
import { aiSearchProjects } from './lib/actions/ai/ai-search-projects';
import { aiUpdateOpportunity } from './lib/actions/ai/ai-update-opportunity';
import { aiUpdateParty } from './lib/actions/ai/ai-update-party';
import { newCaseTrigger } from './lib/triggers/new-case';
import { newOpportunityTrigger } from './lib/triggers/new-opportunity';
import { newTaskTrigger } from './lib/triggers/new-task';
import { newProjectTrigger } from './lib/triggers/new-project';

export const capsuleCrm = createPiece({
  displayName: 'Capsule CRM',
  auth: capsuleCrmAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/capsule-crm.png',
  authors: ['Prabhukiran161', 'onyedikachi-david'],
  actions: [
    createContactAction,
    updateContactAction,
    createOpportunityAction,
    createProjectAction,
    createTaskAction,
    updateOpportunityAction,
    addNoteToEntityAction,
    findContactAction,
    findProjectAction,
    findOpportunityAction,
    aiAddNote,
    aiCompleteTask,
    aiCreateOpportunity,
    aiCreateOrganisation,
    aiCreatePerson,
    aiCreateProject,
    aiCreateTask,
    aiDeleteParty,
    aiGetOpportunity,
    aiGetParty,
    aiGetProject,
    aiListEntries,
    aiListMilestones,
    aiListStages,
    aiListTasks,
    aiListUsers,
    aiSearchOpportunities,
    aiSearchParties,
    aiSearchProjects,
    aiUpdateOpportunity,
    aiUpdateParty,
  ],
  triggers: [
    newCaseTrigger,
    newOpportunityTrigger,
    newTaskTrigger,
    newProjectTrigger,
  ],
});
