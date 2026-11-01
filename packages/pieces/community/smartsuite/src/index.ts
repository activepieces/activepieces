import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { smartsuiteAuth } from './lib/auth';
import { SMARTSUITE_API_URL } from './lib/common/constants';
import { smartSuiteClient } from './lib/common/client';

import { createRecord } from './lib/actions/create-record';
import { updateRecord } from './lib/actions/update-record';
import { deleteRecord } from './lib/actions/delete-record';
import { uploadFile } from './lib/actions/upload-file';
import { findRecords } from './lib/actions/find-records';
import { getRecord } from './lib/actions/get-record';
import { listSolutions } from './lib/actions/list-solutions';
import { getSolution, getSolutionById } from './lib/actions/get-solution';
import { listTables, listTablesById } from './lib/actions/list-tables';
import { getTableSchema, getTableSchemaById } from './lib/actions/get-table-schema';
import { bulkCreateRecords, bulkCreateRecordsById } from './lib/actions/bulk-create-records';
import { bulkUpdateRecords, bulkUpdateRecordsById } from './lib/actions/bulk-update-records';
import { bulkDeleteRecords, bulkDeleteRecordsById } from './lib/actions/bulk-delete-records';
import { upsertRecord, upsertRecordById } from './lib/actions/upsert-record';
import { listDeletedRecords, listDeletedRecordsById } from './lib/actions/list-deleted-records';
import { restoreRecord, restoreRecordById } from './lib/actions/restore-record';
import { listComments, listCommentsById } from './lib/actions/list-comments';
import { addComment, addCommentById } from './lib/actions/add-comment';
import { listMembers } from './lib/actions/list-members';
import { getMember, getMemberById } from './lib/actions/get-member';
import { listTeams } from './lib/actions/list-teams';
import { getFileUrl, getFileUrlByHandle } from './lib/actions/get-file-url';
import { createTable, createTableById } from './lib/actions/create-table';
import { addField, addFieldById } from './lib/actions/add-field';
import { listRecordsAi } from './lib/actions/ai/list-records';
import { getRecordByIdAi } from './lib/actions/ai/get-record-by-id';
import { createRecordByIdAi } from './lib/actions/ai/create-record-by-id';
import { updateRecordFieldsAi } from './lib/actions/ai/update-record-fields';
import { deleteRecordByIdAi } from './lib/actions/ai/delete-record-by-id';
import { attachFileByIdAi } from './lib/actions/ai/attach-file-by-id';

import { newRecord } from './lib/triggers/new-record';
import { updatedRecord } from './lib/triggers/updated-record';

export const smartsuite = createPiece({
	displayName: 'SmartSuite',
	description: 'Collaborative work management platform combining databases with spreadsheets.',
	logoUrl: 'https://cdn.activepieces.com/pieces/smartsuite.png',
	categories: [PieceCategory.PRODUCTIVITY],
	auth: smartsuiteAuth,
	minimumSupportedRelease: '0.88.2',
	authors: ['Kunal-Darekar', 'kishanprmr'],
	actions: [
		createRecord,
		updateRecord,
		deleteRecord,
		uploadFile,
		findRecords,
		getRecord,
		listSolutions,
		getSolution,
		getSolutionById,
		listTables,
		listTablesById,
		getTableSchema,
		getTableSchemaById,
		bulkCreateRecords,
		bulkCreateRecordsById,
		bulkUpdateRecords,
		bulkUpdateRecordsById,
		bulkDeleteRecords,
		bulkDeleteRecordsById,
		upsertRecord,
		upsertRecordById,
		listDeletedRecords,
		listDeletedRecordsById,
		restoreRecord,
		restoreRecordById,
		listComments,
		listCommentsById,
		addComment,
		addCommentById,
		listMembers,
		getMember,
		getMemberById,
		listTeams,
		getFileUrl,
		getFileUrlByHandle,
		createTable,
		createTableById,
		addField,
		addFieldById,
		listRecordsAi,
		getRecordByIdAi,
		createRecordByIdAi,
		updateRecordFieldsAi,
		deleteRecordByIdAi,
		attachFileByIdAi,
		createCustomApiCallAction({
			auth: smartsuiteAuth,
			baseUrl: () => SMARTSUITE_API_URL,
			authMapping: async (auth) => smartSuiteClient.authHeaders(auth.props),
		}),
	],
	triggers: [newRecord, updatedRecord],
});
