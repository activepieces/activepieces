import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createRecord } from './lib/actions/create-record';
import { deleteRecord } from './lib/actions/delete-record';
import { getRecord } from './lib/actions/get-record';
import { customApiCallAuthHeaders, makeAPICall } from './lib/actions/make-api-call';
import { queryRecords } from './lib/actions/query-records';
import { searchRecords } from './lib/actions/search-record';
import { updateRecord } from './lib/actions/update-record';
import { addTagsToRecordAction } from './lib/actions/ai/add-tags-to-record';
import { convertLeadAction } from './lib/actions/ai/convert-lead';
import { createModuleRecordAction } from './lib/actions/ai/create-module-record';
import { deleteRecordByIdAction } from './lib/actions/ai/delete-record-by-id';
import { describeModuleAction } from './lib/actions/ai/describe-module';
import { downloadAttachmentAction } from './lib/actions/ai/download-attachment';
import { findOrCreateRecordAction } from './lib/actions/ai/find-or-create-record';
import { findRecordsByEmailOrPhoneAction } from './lib/actions/ai/find-records-by-email-or-phone';
import { getAccountHierarchyAction } from './lib/actions/ai/get-account-hierarchy';
import { getCurrentUserAction } from './lib/actions/ai/get-current-user';
import { getPicklistDependencyAction } from './lib/actions/ai/get-picklist-dependency';
import { getRecordByIdAction } from './lib/actions/ai/get-record-by-id';
import { getRecordTagsAction } from './lib/actions/ai/get-record-tags';
import { linkRecordsAction } from './lib/actions/ai/link-records';
import { listChangedRecordsAction } from './lib/actions/ai/list-changed-records';
import { listModulesAction } from './lib/actions/ai/list-modules';
import { listRelatedRecordsAction } from './lib/actions/ai/list-related-records';
import { listRelationTypesAction } from './lib/actions/ai/list-relation-types';
import { queryRelatedRecordsAction } from './lib/actions/ai/query-related-records';
import { removeTagsFromRecordAction } from './lib/actions/ai/remove-tags-from-record';
import { reopenRecordAction } from './lib/actions/ai/reopen-record';
import { searchModuleRecordsAction } from './lib/actions/ai/search-module-records';
import { unlinkRecordsAction } from './lib/actions/ai/unlink-records';
import { updateRecordFieldsAction } from './lib/actions/ai/update-record-fields';
import { vtigerAuth } from './lib/auth';
import { isRecord, restBaseUrl } from './lib/rest-client';
import { newOrUpdatedRecord } from './lib/triggers/new-or-updated-record';

export const vtiger = createPiece({
  displayName: 'Vtiger',
  description: 'CRM software for sales, marketing, and support teams',
  auth: vtigerAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/vtiger.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['kanarelo', 'kishanprmr', 'abuaboud', 'privatestefans'],
  actions: [
    createRecord,
    getRecord,
    updateRecord,
    deleteRecord,
    queryRecords,
    searchRecords,
    makeAPICall,
    getCurrentUserAction,
    listModulesAction,
    describeModuleAction,
    createModuleRecordAction,
    getRecordByIdAction,
    updateRecordFieldsAction,
    listChangedRecordsAction,
    deleteRecordByIdAction,
    listRelationTypesAction,
    reopenRecordAction,
    unlinkRecordsAction,
    addTagsToRecordAction,
    getRecordTagsAction,
    removeTagsFromRecordAction,
    getAccountHierarchyAction,
    findRecordsByEmailOrPhoneAction,
    getPicklistDependencyAction,
    convertLeadAction,
    linkRecordsAction,
    listRelatedRecordsAction,
    queryRelatedRecordsAction,
    downloadAttachmentAction,
    searchModuleRecordsAction,
    findOrCreateRecordAction,
    createCustomApiCallAction({
      auth: vtigerAuth,
      baseUrl: (auth) => (auth ? restBaseUrl(auth.props) : ''),
      authMapping: async (auth, propsValue) =>
        customApiCallAuthHeaders({ creds: auth.props, url: isRecord(propsValue['url']) ? propsValue['url']['url'] : undefined }),
    }),
  ],
  triggers: [newOrUpdatedRecord],
});

export { vtigerAuth };
