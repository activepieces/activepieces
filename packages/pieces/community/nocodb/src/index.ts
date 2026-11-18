import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createRecordAction } from './lib/actions/create-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { updateRecordAction } from './lib/actions/update-record';
import { getRecordAction } from './lib/actions/get-record';
import { searchRecordsAction } from './lib/actions/search-records';
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { listWorkspacesAction } from './lib/actions/list-workspaces';
import { listBasesAction } from './lib/actions/list-bases';
import { getTableSchemaAction } from './lib/actions/get-table-schema';
import { listViewSortsAction } from './lib/actions/list-view-sorts';
import { createGridViewAction } from './lib/actions/create-grid-view';
import { listViewColumnsAction } from './lib/actions/list-view-columns';
import { updateViewColumnAction } from './lib/actions/update-view-column';
import { deleteViewAction } from './lib/actions/delete-view';
import { listNotificationsAction } from './lib/actions/list-notifications';
import { getSharedViewGroupedDataAction } from './lib/actions/get-shared-view-grouped-data';
import { uploadAttachmentByUrlAction } from './lib/actions/upload-attachment-by-url';
import { nocodbAuth } from './lib/auth';

export const nocodb = createPiece({
	displayName: 'NocoDB',
	auth: nocodbAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/nocodb.png',
	authors: ['kishanprmr'],
	actions: [
		createRecordAction,
		deleteRecordAction,
		updateRecordAction,
		getRecordAction,
		searchRecordsAction,
		getCurrentUserAction,
		listWorkspacesAction,
		listBasesAction,
		getTableSchemaAction,
		listViewSortsAction,
		createGridViewAction,
		listViewColumnsAction,
		updateViewColumnAction,
		deleteViewAction,
		listNotificationsAction,
		getSharedViewGroupedDataAction,
		uploadAttachmentByUrlAction,
	],
	triggers: [],
});
