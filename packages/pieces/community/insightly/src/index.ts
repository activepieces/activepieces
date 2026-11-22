import { createPiece } from '@activepieces/pieces-framework';
import { insightlyAuth } from './lib/common/common';
import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { getRecord } from './lib/actions/get-record';
import { deleteRecord } from './lib/actions/delete-record';
import { findRecords } from './lib/actions/find-records';
import { addNoteToRecord } from './lib/actions/add-note-to-record';
import { createTaskFriendly } from './lib/actions/create-task-friendly';
import { moveOpportunityStage } from './lib/actions/move-opportunity-stage';
import { aiCreateContact, aiFindContacts, aiGetContact, aiUpdateContact } from './lib/actions/ai/contacts';
import { aiCreateOrganisation, aiFindOrganisations } from './lib/actions/ai/organisations';
import { aiCreateLead, aiFindLeads } from './lib/actions/ai/leads';
import { aiCreateOpportunity, aiFindOpportunities, aiSetOpportunityStage, aiUpdateOpportunity } from './lib/actions/ai/opportunities';
import { aiCreateProject, aiFindProjects } from './lib/actions/ai/projects';
import { aiCompleteTask, aiCreateTask, aiFindTasks } from './lib/actions/ai/tasks';
import { aiAddNote, aiCreateEvent } from './lib/actions/ai/notes-events';
import { aiDeleteRecord, aiGetRecord } from './lib/actions/ai/records';
import { aiFindPipelineStageByName, aiFindUser, aiListCategories, aiListLeadSourcesStatuses, aiListPipelines } from './lib/actions/ai/resolvers';
import { aiListCustomFields, aiSetCustomField } from './lib/actions/ai/custom-fields';
import { newRecord } from './lib/triggers/new-record';
import { updatedRecord } from './lib/triggers/updated-record';
import { deletedRecord } from './lib/triggers/deleted-record';

export const insightly = createPiece({
  displayName: 'Insightly',
  auth: insightlyAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/insightly.png',
  authors: ['fortunamide', 'onyedikachi-david'],
  actions: [
    createRecord,
    updateRecord,
    getRecord,
    deleteRecord,
    findRecords,
    addNoteToRecord,
    createTaskFriendly,
    moveOpportunityStage,
    aiFindContacts,
    aiGetContact,
    aiCreateContact,
    aiUpdateContact,
    aiFindOrganisations,
    aiCreateOrganisation,
    aiFindLeads,
    aiCreateLead,
    aiFindOpportunities,
    aiCreateOpportunity,
    aiUpdateOpportunity,
    aiSetOpportunityStage,
    aiCreateProject,
    aiFindProjects,
    aiCreateTask,
    aiCompleteTask,
    aiFindTasks,
    aiAddNote,
    aiCreateEvent,
    aiGetRecord,
    aiDeleteRecord,
    aiListPipelines,
    aiFindPipelineStageByName,
    aiFindUser,
    aiListCategories,
    aiListCustomFields,
    aiSetCustomField,
    aiListLeadSourcesStatuses,
  ],
  triggers: [newRecord, updatedRecord, deletedRecord],
});
