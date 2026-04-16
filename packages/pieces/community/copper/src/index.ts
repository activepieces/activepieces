import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, PieceAuth, PiecePropValueSchema } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { convertLead } from './lib/actions/convert-lead'
import { createActivity } from './lib/actions/create-activity'
import { createCompany } from './lib/actions/create-company'
import { createLead } from './lib/actions/create-lead'
import { createOpportunity } from './lib/actions/create-opportunity'
import { createPerson } from './lib/actions/create-person'
import { createProject } from './lib/actions/create-project'
import { createTask } from './lib/actions/create-task'
import { searchForACompany } from './lib/actions/search-for-a-company'
import { searchForALead } from './lib/actions/search-for-a-lead'
import { searchForAPerson } from './lib/actions/search-for-a-person'
import { searchForAProject } from './lib/actions/search-for-a-project'
import { searchForAnActivity } from './lib/actions/search-for-an-activity'
import { searchForAnOpportunity } from './lib/actions/search-for-an-opportunity'
import { updateCompany } from './lib/actions/update-company'
import { updateLead } from './lib/actions/update-lead'
import { updateOpportunity } from './lib/actions/update-opportunity'
import { updatePerson } from './lib/actions/update-person'
import { updateProject } from './lib/actions/update-project'
import { BASE_URL, CopperAuth } from './lib/common/constants'
import { newActivity } from './lib/triggers/new-activity'
import { newLead } from './lib/triggers/new-lead'
import { newPerson } from './lib/triggers/new-person'
import { newTask } from './lib/triggers/new-task'
import { updatedLead } from './lib/triggers/updated-lead'
import { updatedLeadStatus } from './lib/triggers/updated-lead-status'
import { updatedOpportunity } from './lib/triggers/updated-opportunity'
import { updatedOpportunityStage } from './lib/triggers/updated-opportunity-stage'
import { updatedOpportunityStatus } from './lib/triggers/updated-opportunity-status'
import { updatedProject } from './lib/triggers/updated-project'
import { updatedTask } from './lib/triggers/updated-task'

export const copper = createPiece({
    displayName: 'Copper',
    auth: CopperAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/copper.png',
    authors: ['gs03-dev'],
    categories: [PieceCategory.SALES_AND_CRM, PieceCategory.PRODUCTIVITY],
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
        createCustomApiCallAction({
            auth: CopperAuth,
            baseUrl: () => BASE_URL,
            authMapping: async (auth) => {
                return {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-PW-AccessToken': auth.props.apiKey,
                    'X-PW-Application': 'developer_api',
                    'X-PW-UserEmail': auth.props.email,
                }
            },
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
        updatedOpportunityStage,
        updatedOpportunityStatus,
        updatedProject,
        updatedLeadStatus,
    ],
})
