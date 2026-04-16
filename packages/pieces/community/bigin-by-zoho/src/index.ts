import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createCall } from './lib/actions/create-call'
import { createCompany } from './lib/actions/create-company'
import { createContact } from './lib/actions/create-contact'
import { createEvent } from './lib/actions/create-event'
import { createPipelineRecord } from './lib/actions/create-pipeline-record'
import { createTask } from './lib/actions/create-task'
import { searchCompanyRecord } from './lib/actions/search-company-record'
import { searchContactRecord } from './lib/actions/search-contact-record'
import { searchPipelineRecord } from './lib/actions/search-pipeline-records'
import { searchProductRecord } from './lib/actions/search-product'
import { searchUser } from './lib/actions/search-user'
import { updateCompany } from './lib/actions/update-company'
import { updateContact } from './lib/actions/update-contact'
import { updateEvent } from './lib/actions/update-event'
import { updatePipelineRecord } from './lib/actions/update-pipeline-record'
import { updateTask } from './lib/actions/update-task'
import { biginAuth } from './lib/auth'
import { DATA_CENTER_REGIONS } from './lib/common/constants'
import { getZohoBiginAccountAuthorizationUrl } from './lib/common/helpers'
import { biginApiService } from './lib/common/request'
import { companyUpdated } from './lib/triggers/company-updated'
import { contactUpdated } from './lib/triggers/contact-updated'
import { newCallCreated } from './lib/triggers/new-call-created'
import { newCompanyCreated } from './lib/triggers/new-company-created'
import { newContactCreated } from './lib/triggers/new-contact-created'
import { newEventCreated } from './lib/triggers/new-event-created'
import { newPipelineRecordCreated } from './lib/triggers/new-pipeline-record'
import { newTaskCreated } from './lib/triggers/new-task-created'
import { pipelineRecordUpdated } from './lib/triggers/pipeline-record-updated'

export const biginByZoho = createPiece({
    displayName: 'Bigin by Zoho CRM',
    description:
        'Bigin by Zoho CRM is a lightweight CRM designed for small businesses to manage contacts, companies, deals (pipeline records), tasks, calls, and events.',
    auth: biginAuth,
    minimumSupportedRelease: '0.36.1',
    categories: [PieceCategory.SALES_AND_CRM],
    logoUrl: 'https://cdn.activepieces.com/pieces/bigin-by-zoho.png',
    authors: ['gs03dev'],
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
})
