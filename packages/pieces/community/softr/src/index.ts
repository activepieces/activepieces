import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { SoftrAuth } from './lib/common/auth';
import { softrClient } from './lib/common/client';
import { createDatabaseRecord } from './lib/actions/create-database-record';
import { createAppUser } from './lib/actions/create-app-user';
import { deleteAppUser } from './lib/actions/delete-app-user';
import { deleteDatabaseRecord } from './lib/actions/delete-database-record';
import { findDatabaseRecord } from './lib/actions/find-database-record';
import { updateDatabaseRecord } from './lib/actions/update-database-record';
import { getDatabaseRecord } from './lib/actions/get-database-record';
import { findRecords } from './lib/actions/find-records';
import { listDatabases } from './lib/actions/list-databases';
import { listTables } from './lib/actions/list-tables';
import { getTable } from './lib/actions/get-table';
import { activateAppUser } from './lib/actions/activate-app-user';
import { deactivateAppUser } from './lib/actions/deactivate-app-user';
import { inviteAppUser } from './lib/actions/invite-app-user';
import { generateMagicLink } from './lib/actions/generate-magic-link';
import { getDatabase } from './lib/actions/get-database';
import { listTableViews } from './lib/actions/list-table-views';
import { createDatabase } from './lib/actions/create-database';
import { updateDatabase } from './lib/actions/update-database';
import { deleteDatabase } from './lib/actions/delete-database';
import { createTable } from './lib/actions/create-table';
import { updateTable } from './lib/actions/update-table';
import { deleteTable } from './lib/actions/delete-table';
import { createTableField } from './lib/actions/create-table-field';
import { getTableField } from './lib/actions/get-table-field';
import { updateTableField } from './lib/actions/update-table-field';
import { deleteTableField } from './lib/actions/delete-table-field';
import { getDatabaseSchemaAi } from './lib/actions/get-database-schema-ai';
import { createRecordAi } from './lib/actions/create-record-ai';
import { updateRecordAi } from './lib/actions/update-record-ai';
import { upsertRecordAi } from './lib/actions/upsert-record-ai';
import { newDatabaseRecord } from './lib/triggers/new-database-record';

export const softr = createPiece({
	displayName: 'Softr',
	auth: SoftrAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/softr.png',
	categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
	authors: ['Sanket6652'],
	actions: [
		createAppUser,
		createDatabaseRecord,
		deleteAppUser,
		deleteDatabaseRecord,
		findDatabaseRecord,
		updateDatabaseRecord,
		getDatabaseRecord,
		findRecords,
		listDatabases,
		listTables,
		getTable,
		activateAppUser,
		deactivateAppUser,
		inviteAppUser,
		generateMagicLink,
		getDatabase,
		listTableViews,
		createDatabase,
		updateDatabase,
		deleteDatabase,
		createTable,
		updateTable,
		deleteTable,
		createTableField,
		getTableField,
		updateTableField,
		deleteTableField,
		getDatabaseSchemaAi,
		createRecordAi,
		updateRecordAi,
		upsertRecordAi,
		createCustomApiCallAction({
			auth: SoftrAuth,
			baseUrl: () => softrClient.baseUrl,
			authMapping: async (auth) => {
				return {
					'Softr-Api-Key': auth.secret_text,
				};
			},
		}),
	],
	triggers: [newDatabaseRecord],
});
