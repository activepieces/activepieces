import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { folkAuth } from './lib/common/auth';
import { companyAdded } from './lib/triggers/company-added';
import { companyRemoved } from './lib/triggers/company-removed';
import { companyUpdated } from './lib/triggers/company-updated';
import { companyCustomFieldUpdated } from './lib/triggers/company-custom-field-updated';
import { personAdded } from './lib/triggers/person-added';
import { personRemoved } from './lib/triggers/person-removed';
import { personUpdated } from './lib/triggers/person-updated';
import { personCustomFieldUpdated } from './lib/triggers/person-custom-field-updated';
import { createCompany } from './lib/actions/create-company';
import { updateCompany } from './lib/actions/update-company';
import { createPerson } from './lib/actions/create-person';
import { updatePerson } from './lib/actions/update-person';
import { findCompany } from './lib/actions/find-company';
import { getCompany } from './lib/actions/get-company';
import { findPerson } from './lib/actions/find-person';
import { getPerson } from './lib/actions/get-person';
import { folkCustomApiCall } from './lib/actions/custom-api-call';
import { createCompanyAi } from './lib/actions/ai/create-company-ai';
import { createGroupObject } from './lib/actions/ai/create-group-object';
import { createNote } from './lib/actions/ai/create-note';
import { createPersonAi } from './lib/actions/ai/create-person-ai';
import { createTask } from './lib/actions/ai/create-task';
import { deleteCompany } from './lib/actions/ai/delete-company';
import { deleteGroupObject } from './lib/actions/ai/delete-group-object';
import { deleteNote } from './lib/actions/ai/delete-note';
import { deletePerson } from './lib/actions/ai/delete-person';
import { deleteTask } from './lib/actions/ai/delete-task';
import { getCompanyAi } from './lib/actions/ai/get-company-ai';
import { getCurrentUser } from './lib/actions/ai/get-current-user';
import { getNote } from './lib/actions/ai/get-note';
import { getPersonAi } from './lib/actions/ai/get-person-ai';
import { listGroupCustomFields } from './lib/actions/ai/list-group-custom-fields';
import { listGroupObjects } from './lib/actions/ai/list-group-objects';
import { listGroups } from './lib/actions/ai/list-groups';
import { listNotes } from './lib/actions/ai/list-notes';
import { listTasks } from './lib/actions/ai/list-tasks';
import { listUsers } from './lib/actions/ai/list-users';
import { logInteraction } from './lib/actions/ai/log-interaction';
import { searchCompanies } from './lib/actions/ai/search-companies';
import { searchPeople } from './lib/actions/ai/search-people';
import { updateCompanyAi } from './lib/actions/ai/update-company-ai';
import { updateGroupObject } from './lib/actions/ai/update-group-object';
import { updateNote } from './lib/actions/ai/update-note';
import { updatePersonAi } from './lib/actions/ai/update-person-ai';
import { updateTask } from './lib/actions/ai/update-task';

export const folk = createPiece({
  displayName: 'Folk',
  auth: folkAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/folk.png',
  authors: ['sparkybug', 'OdaiAhmed99'],
  categories: [PieceCategory.SALES_AND_CRM],
  description:
    'Folk is a CRM for building relationships at scale. Manage your contacts, companies, and relationships in one place.',
  actions: [
    createCompany,
    updateCompany,
    createPerson,
    updatePerson,
    findCompany,
    getCompany,
    findPerson,
    getPerson,
    folkCustomApiCall,
    createCompanyAi,
    createGroupObject,
    createNote,
    createPersonAi,
    createTask,
    deleteCompany,
    deleteGroupObject,
    deleteNote,
    deletePerson,
    deleteTask,
    getCompanyAi,
    getCurrentUser,
    getNote,
    getPersonAi,
    listGroupCustomFields,
    listGroupObjects,
    listGroups,
    listNotes,
    listTasks,
    listUsers,
    logInteraction,
    searchCompanies,
    searchPeople,
    updateCompanyAi,
    updateGroupObject,
    updateNote,
    updatePersonAi,
    updateTask,
  ],
  triggers: [
    companyAdded,
    companyRemoved,
    companyUpdated,
    companyCustomFieldUpdated,
    personAdded,
    personRemoved,
    personUpdated,
    personCustomFieldUpdated,
  ],
});
