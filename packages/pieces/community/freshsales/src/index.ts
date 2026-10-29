import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { freshsalesAuth } from './lib/auth';
import { freshsalesClient } from './lib/common/client';
import { addNote } from './lib/actions/add-note';
import { createAccount } from './lib/actions/create-account';
import { createAppointment } from './lib/actions/create-appointment';
import { freshSalesCreateContact } from './lib/actions/create-contact';
import { createDeal } from './lib/actions/create-deal';
import { createTask } from './lib/actions/create-task';
import { deleteContact } from './lib/actions/delete-contact';
import { deleteDeal } from './lib/actions/delete-deal';
import { findAccountByName } from './lib/actions/find-account-by-name';
import { findContactByEmail } from './lib/actions/find-contact-by-email';
import { getAccount } from './lib/actions/get-account';
import { getContact } from './lib/actions/get-contact';
import { getCustomFields } from './lib/actions/get-custom-fields';
import { getDeal } from './lib/actions/get-deal';
import { listFieldOptions } from './lib/actions/list-field-options';
import { listPipelines } from './lib/actions/list-pipelines';
import { listRecords } from './lib/actions/list-records';
import { listTasks } from './lib/actions/list-tasks';
import { listUsers } from './lib/actions/list-users';
import { logSalesActivity } from './lib/actions/log-sales-activity';
import { searchRecords } from './lib/actions/search-records';
import { updateAccount } from './lib/actions/update-account';
import { updateContact } from './lib/actions/update-contact';
import { updateDeal } from './lib/actions/update-deal';
import { updateTask } from './lib/actions/update-task';
import { deleteAccount } from './lib/actions/delete-account';
import { forgetContact } from './lib/actions/forget-contact';
import { getTask } from './lib/actions/get-task';
import { deleteTask } from './lib/actions/delete-task';
import { updateNote } from './lib/actions/update-note';
import { deleteNote } from './lib/actions/delete-note';
import { getAppointment } from './lib/actions/get-appointment';
import { updateAppointment } from './lib/actions/update-appointment';
import { deleteAppointment } from './lib/actions/delete-appointment';
import { filteredSearch } from './lib/actions/filtered-search';
import { addContactsToList } from './lib/actions/add-contacts-to-list';
import { removeContactsFromList } from './lib/actions/remove-contacts-from-list';
import { upsertContact } from './lib/actions/upsert-contact';
import { newAccount } from './lib/triggers/new-account';
import { newContact } from './lib/triggers/new-contact';
import { newDeal } from './lib/triggers/new-deal';
import { updatedContact } from './lib/triggers/updated-contact';
import { updatedDeal } from './lib/triggers/updated-deal';

export const freshsales = createPiece({
  displayName: 'Freshsales',
  description: 'Sales CRM software',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/freshsales.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'OdaiAhmed99'],
  auth: freshsalesAuth,
  actions: [
    freshSalesCreateContact,
    updateContact,
    upsertContact,
    getContact,
    findContactByEmail,
    deleteContact,
    forgetContact,
    createAccount,
    updateAccount,
    getAccount,
    findAccountByName,
    deleteAccount,
    createDeal,
    updateDeal,
    getDeal,
    deleteDeal,
    searchRecords,
    listRecords,
    filteredSearch,
    createTask,
    updateTask,
    getTask,
    deleteTask,
    listTasks,
    addNote,
    updateNote,
    deleteNote,
    createAppointment,
    getAppointment,
    updateAppointment,
    deleteAppointment,
    logSalesActivity,
    addContactsToList,
    removeContactsFromList,
    listUsers,
    listPipelines,
    listFieldOptions,
    getCustomFields,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? freshsalesClient.getBaseUrl(auth.username) : ''),
      auth: freshsalesAuth,
      authMapping: async (auth) => ({
        Authorization: `Token token=${auth.password.trim()}`,
      }),
    }),
  ],
  triggers: [
    newContact,
    updatedContact,
    newDeal,
    updatedDeal,
    newAccount,
  ],
});
