import {
	PieceAuth,
	Property,
	createPiece,
	OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { addContactToCampaign } from './lib/action/add-contact-to-campaign';
import { addFileToRecord } from './lib/action/add-file-to-record';
import { addLeadToCampaign } from './lib/action/add-lead-to-campaign';
import { createAttachment } from './lib/action/create-attachment';
import { createCase } from './lib/action/create-case';
import { createContact } from './lib/action/create-contact';
import { createLead } from './lib/action/create-lead';
import { createNote } from './lib/action/create-note';
import { createOpportunity } from './lib/action/create-opportunity';
import { createRecord } from './lib/action/create-record';
import { createTask } from './lib/action/create-task';
import { deleteOpportunity } from './lib/action/delete-opportunity';
import { deleteRecord } from './lib/action/delete-record';
import { findChildRecords } from './lib/action/find-child-records';
import { findRecord } from './lib/action/find-record';
import { findRecordsByQuery } from './lib/action/find-records-by-query';
import { getRecordAttachments } from './lib/action/get-record-attachments';
import { runQuery } from './lib/action/run-sf-query';
import { runReport } from './lib/action/run-report';
import { sendEmail } from './lib/action/send-email';
import { updateContact } from './lib/action/update-contact';
import { updateLead } from './lib/action/update-lead';
import { updateRecord } from './lib/action/update-record';
import { upsertByExternalId } from './lib/action/upsert-by-external-id';
import { upsertByExternalIdBulk } from './lib/action/upsert-by-external-id-bulk';

import { newCaseAttachment } from './lib/trigger/new-case-attachment';
import { newContact } from './lib/trigger/new-contact';
import { newFieldHistoryEvent } from './lib/trigger/new-field-history-event';
import { newLead } from './lib/trigger/new-lead';
import { newOrUpdatedRecord } from './lib/trigger/new-updated-record';
import { newOutboundMessage } from './lib/trigger/new-outbound-message';
import { newRecord } from './lib/trigger/new-record';
import { newUpdatedFile } from './lib/trigger/new-updated-file';
import { exportReport } from './lib/action/export-report';
import { newCaseCreatedTrigger } from './lib/trigger/new-case-in-queue';
import { addContactToCampaignMember } from './lib/action/ai/add-contact-to-campaign-member';
import { addLeadToCampaignMember } from './lib/action/ai/add-lead-to-campaign-member';
import { addOpportunityProduct } from './lib/action/ai/add-opportunity-product';
import { applyLeadAssignmentRules } from './lib/action/ai/apply-lead-assignment-rules';
import { completeTask } from './lib/action/ai/complete-task';
import { createAccount } from './lib/action/ai/create-account';
import { createBulkQueryJob } from './lib/action/ai/create-bulk-query-job';
import { createCampaign } from './lib/action/ai/create-campaign';
import { createRecordTree } from './lib/action/ai/create-record-tree';
import { createRecordsBatch } from './lib/action/ai/create-records-batch';
import { createSfContact } from './lib/action/ai/create-sf-contact';
import { createSfLead } from './lib/action/ai/create-sf-lead';
import { createSfNote } from './lib/action/ai/create-sf-note';
import { createSfOpportunity } from './lib/action/ai/create-sf-opportunity';
import { createSfTask } from './lib/action/ai/create-sf-task';
import { createSobjectRecord } from './lib/action/ai/create-sobject-record';
import { deleteFile } from './lib/action/ai/delete-file';
import { deleteRecordsBatch } from './lib/action/ai/delete-records-batch';
import { deleteSobjectRecord } from './lib/action/ai/delete-sobject-record';
import { describeObject } from './lib/action/ai/describe-object';
import { downloadFile } from './lib/action/ai/download-file';
import { getBulkIngestJob } from './lib/action/ai/get-bulk-ingest-job';
import { getBulkIngestResults } from './lib/action/ai/get-bulk-ingest-results';
import { getBulkQueryJob } from './lib/action/ai/get-bulk-query-job';
import { getBulkQueryResults } from './lib/action/ai/get-bulk-query-results';
import { getChildRecords } from './lib/action/ai/get-child-records';
import { getCurrentUser } from './lib/action/ai/get-current-user';
import { getDashboard } from './lib/action/ai/get-dashboard';
import { getFileInfo } from './lib/action/ai/get-file-info';
import { getListViewMetadata } from './lib/action/ai/get-list-view-metadata';
import { getListViewRecords } from './lib/action/ai/get-list-view-records';
import { getNextQueryPage } from './lib/action/ai/get-next-query-page';
import { getOrgLimits } from './lib/action/ai/get-org-limits';
import { getQuickActionDefaults } from './lib/action/ai/get-quick-action-defaults';
import { getRecordByExternalId } from './lib/action/ai/get-record-by-external-id';
import { getRecordCounts } from './lib/action/ai/get-record-counts';
import { getRecord } from './lib/action/ai/get-record';
import { getRecordsBatch } from './lib/action/ai/get-records-batch';
import { getReportInstance } from './lib/action/ai/get-report-instance';
import { getReport } from './lib/action/ai/get-report';
import { getUpdatedRecordIds } from './lib/action/ai/get-updated-record-ids';
import { listDashboards } from './lib/action/ai/list-dashboards';
import { listEmailTemplates } from './lib/action/ai/list-email-templates';
import { listInvocableActions } from './lib/action/ai/list-invocable-actions';
import { listListViews } from './lib/action/ai/list-list-views';
import { listObjects } from './lib/action/ai/list-objects';
import { listPricebooks } from './lib/action/ai/list-pricebooks';
import { listQuickActions } from './lib/action/ai/list-quick-actions';
import { listReports } from './lib/action/ai/list-reports';
import { logCall } from './lib/action/ai/log-call';
import { logEmailActivity } from './lib/action/ai/log-email-activity';
import { removeCampaignMember } from './lib/action/ai/remove-campaign-member';
import { runBulkIngestJob } from './lib/action/ai/run-bulk-ingest-job';
import { runInvocableAction } from './lib/action/ai/run-invocable-action';
import { runQuickAction } from './lib/action/ai/run-quick-action';
import { runReportAsync } from './lib/action/ai/run-report-async';
import { runReportSync } from './lib/action/ai/run-report-sync';
import { runSoqlQueryAll } from './lib/action/ai/run-soql-query-all';
import { runSoqlQuery } from './lib/action/ai/run-soql-query';
import { runToolingQuery } from './lib/action/ai/run-tooling-query';
import { searchAccounts } from './lib/action/ai/search-accounts';
import { searchContacts } from './lib/action/ai/search-contacts';
import { searchKnowledgeArticles } from './lib/action/ai/search-knowledge-articles';
import { searchLeads } from './lib/action/ai/search-leads';
import { searchOpportunities } from './lib/action/ai/search-opportunities';
import { searchRecordsSosl } from './lib/action/ai/search-records-sosl';
import { sendEmailMessage } from './lib/action/ai/send-email-message';
import { updateAccount } from './lib/action/ai/update-account';
import { updateCampaign } from './lib/action/ai/update-campaign';
import { updateOpportunity } from './lib/action/ai/update-opportunity';
import { updateSfContact } from './lib/action/ai/update-sf-contact';
import { updateSfLead } from './lib/action/ai/update-sf-lead';
import { updateSobjectRecord } from './lib/action/ai/update-sobject-record';
import { updateTask } from './lib/action/ai/update-task';
import { uploadFile } from './lib/action/ai/upload-file';
import { upsertRecordByExternalId } from './lib/action/ai/upsert-record-by-external-id';
import { upsertRecordsBatch } from './lib/action/ai/upsert-records-batch';

export const salesforceAuth = PieceAuth.OAuth2({
	props: {
		environment: Property.ShortText({
			displayName: 'Salesforce Domain',
			description:
				'Enter your Salesforce domain. Use "login.salesforce.com" for Production, "test.salesforce.com" for Sandbox, or your custom My Domain (e.g. "mycompany.my.salesforce.com" or "mycompany.sandbox.my.salesforce.com").',
			required: true,
			defaultValue: 'login.salesforce.com',
		}),
	},
	required: true,
	description: 'Authenticate with Salesforce',
	authUrl: 'https://{environment}/services/oauth2/authorize',
	tokenUrl: 'https://{environment}/services/oauth2/token',
	scope: ['refresh_token', 'full', 'api'],
	pkce: true,
	pkceMethod: 'S256',
});

export const salesforce = createPiece({
	displayName: 'Salesforce',
	description: 'CRM software solutions and enterprise cloud computing',
	minimumSupportedRelease: '0.87.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/salesforce.png',
	authors: [
		'HKudria',
		'tanoggy',
		'landonmoir',
		'kishanprmr',
		'khaledmashaly',
		'abuaboud',
		'Pranith124',
		'sanket-a11y',
	],
	categories: [PieceCategory.SALES_AND_CRM],
	auth: salesforceAuth,
	actions: [
		addContactToCampaign,
		addFileToRecord,
		addLeadToCampaign,
		createAttachment,
		createCase,
		createContact,
		createLead,
		createNote,
		createOpportunity,
		createRecord,
		createTask,
		deleteOpportunity,
		deleteRecord,
		exportReport,
		findChildRecords,
		findRecord,
		findRecordsByQuery,
		getRecordAttachments,
		runQuery,
		runReport,
		sendEmail,
		updateContact,
		updateLead,
		updateRecord,
		upsertByExternalId,
		upsertByExternalIdBulk,
		addContactToCampaignMember,
		addLeadToCampaignMember,
		addOpportunityProduct,
		applyLeadAssignmentRules,
		completeTask,
		createAccount,
		createBulkQueryJob,
		createCampaign,
		createRecordTree,
		createRecordsBatch,
		createSfContact,
		createSfLead,
		createSfNote,
		createSfOpportunity,
		createSfTask,
		createSobjectRecord,
		deleteFile,
		deleteRecordsBatch,
		deleteSobjectRecord,
		describeObject,
		downloadFile,
		getBulkIngestJob,
		getBulkIngestResults,
		getBulkQueryJob,
		getBulkQueryResults,
		getChildRecords,
		getCurrentUser,
		getDashboard,
		getFileInfo,
		getListViewMetadata,
		getListViewRecords,
		getNextQueryPage,
		getOrgLimits,
		getQuickActionDefaults,
		getRecordByExternalId,
		getRecordCounts,
		getRecord,
		getRecordsBatch,
		getReportInstance,
		getReport,
		getUpdatedRecordIds,
		listDashboards,
		listEmailTemplates,
		listInvocableActions,
		listListViews,
		listObjects,
		listPricebooks,
		listQuickActions,
		listReports,
		logCall,
		logEmailActivity,
		removeCampaignMember,
		runBulkIngestJob,
		runInvocableAction,
		runQuickAction,
		runReportAsync,
		runReportSync,
		runSoqlQueryAll,
		runSoqlQuery,
		runToolingQuery,
		searchAccounts,
		searchContacts,
		searchKnowledgeArticles,
		searchLeads,
		searchOpportunities,
		searchRecordsSosl,
		sendEmailMessage,
		updateAccount,
		updateCampaign,
		updateOpportunity,
		updateSfContact,
		updateSfLead,
		updateSobjectRecord,
		updateTask,
		uploadFile,
		upsertRecordByExternalId,
		upsertRecordsBatch,
		createCustomApiCallAction({
			baseUrl: (auth) => (auth as OAuth2PropertyValue).data['instance_url'],
			auth: salesforceAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
			}),
		}),
	],
	triggers: [
		newCaseAttachment,
		newContact,
		newFieldHistoryEvent,
		newLead,
		newOrUpdatedRecord,
		newOutboundMessage,
		newRecord,
		newUpdatedFile,
		newCaseCreatedTrigger,
	],
});
