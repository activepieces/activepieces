import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { addNoteAction } from './lib/actions/add-note';
import { associateRecordsAction } from './lib/actions/associate-records';
import { createRecordAction } from './lib/actions/create-record';
import { createTaskAction } from './lib/actions/create-task';
import { deleteRecordAction } from './lib/actions/delete-record';
import { disassociateRecordsAction } from './lib/actions/disassociate-records';
import { getRecordAction } from './lib/actions/get-record';
import { runFetchXmlAction } from './lib/actions/run-fetchxml';
import { searchRecordsAction } from './lib/actions/search-records';
import { updateRecordAction } from './lib/actions/update-record';
import { aiAddNoteAction } from './lib/actions/ai/ai-add-note';
import { aiAssociateRecordsAction } from './lib/actions/ai/ai-associate-records';
import { aiCloseOpportunityAction } from './lib/actions/ai/ai-close-opportunity';
import { aiCreateRecordAction } from './lib/actions/ai/ai-create-record';
import { aiCreateTaskAction } from './lib/actions/ai/ai-create-task';
import { aiDeleteRecordAction } from './lib/actions/ai/ai-delete-record';
import { aiDescribeEntityAction } from './lib/actions/ai/ai-describe-entity';
import { aiGetRecordAction } from './lib/actions/ai/ai-get-record';
import { aiListEntitiesAction } from './lib/actions/ai/ai-list-entities';
import { aiQualifyLeadAction } from './lib/actions/ai/ai-qualify-lead';
import { aiRunFetchXmlAction } from './lib/actions/ai/ai-run-fetchxml';
import { aiSearchRecordsAction } from './lib/actions/ai/ai-search-records';
import { aiUpdateRecordAction } from './lib/actions/ai/ai-update-record';
import { aiWhoAmIAction } from './lib/actions/ai/ai-who-am-i';
import { createAccountAction } from './lib/actions/sales/create-account';
import { createContactAction } from './lib/actions/sales/create-contact';
import { createLeadAction } from './lib/actions/sales/create-lead';
import { createOpportunityAction } from './lib/actions/sales/create-opportunity';
import { findAccountAction } from './lib/actions/sales/find-account';
import { findContactAction } from './lib/actions/sales/find-contact';
import { findLeadAction } from './lib/actions/sales/find-lead';
import { findOpportunityAction } from './lib/actions/sales/find-opportunity';
import { loseOpportunityAction } from './lib/actions/sales/lose-opportunity';
import { qualifyLeadAction } from './lib/actions/sales/qualify-lead';
import { updateAccountAction } from './lib/actions/sales/update-account';
import { updateContactAction } from './lib/actions/sales/update-contact';
import { updateLeadAction } from './lib/actions/sales/update-lead';
import { updateOpportunityAction } from './lib/actions/sales/update-opportunity';
import { winOpportunityAction } from './lib/actions/sales/win-opportunity';
import { newContactTrigger } from './lib/triggers/new-contact';
import { newLeadTrigger } from './lib/triggers/new-lead';
import { newOpportunityTrigger } from './lib/triggers/new-opportunity';
import { newRecordTrigger } from './lib/triggers/new-record';
import { updatedRecordTrigger } from './lib/triggers/updated-record';
import { dynamicsCRMAuth } from './lib/auth';
import { dynamicsHostUrl } from './lib/common/host-url';

export const microsoftDynamicsCrm = createPiece({
  displayName: 'Microsoft Dynamics CRM',
  auth: dynamicsCRMAuth,
  description:
    'Customer relationship management software package developed by Microsoft.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-dynamics-crm.png',
  authors: ['kishanprmr'],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    addNoteAction,
    associateRecordsAction,
    createRecordAction,
    createTaskAction,
    deleteRecordAction,
    disassociateRecordsAction,
    getRecordAction,
    runFetchXmlAction,
    searchRecordsAction,
    updateRecordAction,
    aiAddNoteAction,
    aiAssociateRecordsAction,
    aiCloseOpportunityAction,
    aiCreateRecordAction,
    aiCreateTaskAction,
    aiDeleteRecordAction,
    aiDescribeEntityAction,
    aiGetRecordAction,
    aiListEntitiesAction,
    aiQualifyLeadAction,
    aiRunFetchXmlAction,
    aiSearchRecordsAction,
    aiUpdateRecordAction,
    aiWhoAmIAction,
    createAccountAction,
    createContactAction,
    createLeadAction,
    createOpportunityAction,
    findAccountAction,
    findContactAction,
    findLeadAction,
    findOpportunityAction,
    loseOpportunityAction,
    qualifyLeadAction,
    updateAccountAction,
    updateContactAction,
    updateLeadAction,
    updateOpportunityAction,
    winOpportunityAction,
    createCustomApiCallAction({
      auth: dynamicsCRMAuth,
      baseUrl: (auth) => {
        if (!auth?.props) {
          return '';
        }
        return dynamicsHostUrl.getApiBaseUrl({
          hostUrl: auth.props['hostUrl'],
          proxyUrl: auth.props['proxyUrl'],
        });
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.access_token}`,
      }),
    }),
  ],
  triggers: [
    newContactTrigger,
    newLeadTrigger,
    newOpportunityTrigger,
    newRecordTrigger,
    updatedRecordTrigger,
  ],
});
