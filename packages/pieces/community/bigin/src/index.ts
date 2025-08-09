import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCall } from './lib/actions/create-call';
import { createContact } from './lib/actions/create-contact';
import { biginAuth } from './lib/common/auth';
import { newContact } from './lib/triggers/new-contact';
import { updatedContact } from './lib/triggers/updated-contact';
import { newCall } from './lib/triggers/new-call';
import { newPipelineRecord } from './lib/triggers/new-pipeline-record';
import { updateContact } from './lib/actions/update-contact';
import { createCompany } from './lib/actions/create-company';
import { createEvent } from './lib/actions/create-event';
import { createPipelineRecord } from './lib/actions/create-pipeline-record';
import { createTask } from './lib/actions/create-task';
import { searchCompany } from './lib/actions/search-company';
import { searchContact } from './lib/actions/search-contact';
import { searchPipelineRecord } from './lib/actions/search-pipeline-record';
import { searchProduct } from './lib/actions/search-product';
import { searchUser } from './lib/actions/search-user';
import { updateCompany } from './lib/actions/update-company';
import { updateEvent } from './lib/actions/update-event';
import { updatePipelineRecord } from './lib/actions/update-pipeline-record';
import { updateTask } from './lib/actions/update-task';
import { newCompany } from './lib/triggers/new-company';
import { newEvent } from './lib/triggers/new-event';
import { newTask } from './lib/triggers/new-task';
import { updatedCompany } from './lib/triggers/updated-company';
import { updatedPipelineRecord } from './lib/triggers/updated-pipeline-record';

export const bigin = createPiece({
  displayName: 'Bigin',
  auth: biginAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bigin.png',
  authors: ['Sanket6652'],
  actions: [
    createCall,
    createCompany,
    createContact,
    createEvent,
    createPipelineRecord,
    createTask,
    searchCompany,
    searchContact,
    searchPipelineRecord,
    searchProduct,
    searchUser,
    updateCompany,
    updateContact,
    updateEvent,
    updatePipelineRecord,
    updateTask,
  ],
  triggers: [
    newCall,
    newCompany,
    newContact,
    newEvent,
    newPipelineRecord,
    newTask,
    updatedCompany,
    updatedContact,
    updatedPipelineRecord,
  ],
});
