
import { createPiece } from "@activepieces/pieces-framework";
import { newContactCreated } from "./lib/triggers/new-contact-created";
import { PieceCategory } from '@activepieces/pieces-framework';
import { companyUpdated } from "./lib/triggers/company-updated";
import { contactUpdated } from "./lib/triggers/contact-updated";
import { newCallCreated } from "./lib/triggers/new-call-created";
import { newCompanyCreated } from "./lib/triggers/new-company-created";
import { newTaskCreated } from "./lib/triggers/new-task-created";
import { newEventCreated } from "./lib/triggers/new-event-created";
import { newPipelineRecordCreated } from "./lib/triggers/new-pipeline-record";
import { pipelineRecordUpdated } from "./lib/triggers/pipeline-record-updated";
import { createCompany } from "./lib/actions/create-company";
import { updateCompany } from "./lib/actions/update-company";
import { createContact } from "./lib/actions/create-contact";
import { updateContact } from "./lib/actions/update-contact";
import { createTask } from "./lib/actions/create-task";
import { updateTask } from "./lib/actions/update-task";
import { createCall } from "./lib/actions/create-call";
import { createEvent } from "./lib/actions/create-event";
import { updateEvent } from "./lib/actions/update-event";
import { createPipelineRecord } from "./lib/actions/create-pipeline-record";
import { updatePipelineRecord } from "./lib/actions/update-pipeline-record";
import { searchPipelineRecord } from "./lib/actions/search-pipeline-records";
import { searchCompanyRecord } from "./lib/actions/search-company-record";
import { searchContactRecord } from "./lib/actions/search-contact-record";
import { searchProductRecord } from "./lib/actions/search-product";
import { searchUser } from "./lib/actions/search-user";
import { biginAuth } from './lib/auth';
import { addNote } from './lib/actions/add-note';
import { deleteRecord } from './lib/actions/delete-record';
import { biginSearchRecordsAi } from './lib/actions/ai/search-records';
import { biginGetRecordAi } from './lib/actions/ai/get-record';
import { biginListRecordsAi } from './lib/actions/ai/list-records';
import { biginListUsersAi } from './lib/actions/ai/list-users';
import { biginListPipelinesAi } from './lib/actions/ai/list-pipelines';
import { biginCreateContactAi } from './lib/actions/ai/create-contact';
import { biginUpdateContactAi } from './lib/actions/ai/update-contact';
import { biginCreateCompanyAi } from './lib/actions/ai/create-company';
import { biginUpdateCompanyAi } from './lib/actions/ai/update-company';
import { biginCreateDealAi } from './lib/actions/ai/create-deal';
import { biginUpdateDealAi } from './lib/actions/ai/update-deal';
import { biginCreateTaskAi } from './lib/actions/ai/create-task';
import { biginUpdateTaskAi } from './lib/actions/ai/update-task';
import { biginCreateEventAi } from './lib/actions/ai/create-event';
import { biginUpdateEventAi } from './lib/actions/ai/update-event';
import { biginLogCallAi } from './lib/actions/ai/log-call';


export const biginByZoho = createPiece({
  displayName: 'Bigin by Zoho CRM',
  description:
    'Bigin by Zoho CRM is a lightweight CRM designed for small businesses to manage contacts, companies, deals (pipeline records), tasks, calls, and events.',
  auth: biginAuth,
  minimumSupportedRelease: '0.86.4',
  categories: [PieceCategory.SALES_AND_CRM],
  logoUrl: 'https://cdn.activepieces.com/pieces/bigin-by-zoho.png',
  authors: ['gs03dev', 'OdaiAhmed99'],
  actions: [
    createCompany,
    updateCompany,
    createContact,
    updateContact,
    createTask,
    updateTask,
    createCall,
    createEvent,
    updateEvent,
    createPipelineRecord,
    updatePipelineRecord,
    searchPipelineRecord,
    searchCompanyRecord,
    searchContactRecord,
    searchProductRecord,
    searchUser,
    addNote,
    deleteRecord,
    biginSearchRecordsAi,
    biginGetRecordAi,
    biginListRecordsAi,
    biginListUsersAi,
    biginListPipelinesAi,
    biginCreateContactAi,
    biginUpdateContactAi,
    biginCreateCompanyAi,
    biginUpdateCompanyAi,
    biginCreateDealAi,
    biginUpdateDealAi,
    biginCreateTaskAi,
    biginUpdateTaskAi,
    biginCreateEventAi,
    biginUpdateEventAi,
    biginLogCallAi,
  ],
  triggers: [
    newContactCreated, 
    contactUpdated,
    newCompanyCreated,
    companyUpdated,
    newCallCreated,
    newTaskCreated,
    newEventCreated,
    newPipelineRecordCreated,
    pipelineRecordUpdated,
  ],
});
