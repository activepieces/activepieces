import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { codaAuth } from './lib/auth';
import { CODA_BASE_URL, codaApi } from './lib/common/client';
import { findRowAction } from './lib/actions/find-row';
import { createRowAction } from './lib/actions/create-row';
import { upsertRowAction } from './lib/actions/upsert-row';
import { updateRowAction } from './lib/actions/update-row';
import { getRowAction } from './lib/actions/get-row';
import { listTablesAction } from './lib/actions/list-tables';
import { getTableAction } from './lib/actions/get-table';
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { listDocsAction } from './lib/actions/list-docs';
import { getDocAction } from './lib/actions/get-doc';
import { createDocAction } from './lib/actions/create-doc';
import { deleteDocAction } from './lib/actions/delete-doc';
import { listFoldersAction } from './lib/actions/list-folders';
import { listPagesAction } from './lib/actions/list-pages';
import { getPageAction } from './lib/actions/get-page';
import { createPageAction } from './lib/actions/create-page';
import { updatePageAction } from './lib/actions/update-page';
import { deletePageAction } from './lib/actions/delete-page';
import { getPageContentAction } from './lib/actions/get-page-content';
import { listColumnsAction } from './lib/actions/list-columns';
import { listRowsAction } from './lib/actions/list-rows';
import { createRowsAction } from './lib/actions/create-rows';
import { upsertRowsAction } from './lib/actions/upsert-rows';
import { deleteRowsAction } from './lib/actions/delete-rows';
import { pushButtonAction } from './lib/actions/push-button';
import { listFormulasAction } from './lib/actions/list-formulas';
import { getFormulaAction } from './lib/actions/get-formula';
import { listControlsAction } from './lib/actions/list-controls';
import { getControlAction } from './lib/actions/get-control';
import { getMutationStatusAction } from './lib/actions/get-mutation-status';
import { listPermissionsAction } from './lib/actions/list-permissions';
import { addPermissionAction } from './lib/actions/add-permission';
import { removePermissionAction } from './lib/actions/remove-permission';
import { triggerAutomationAction } from './lib/actions/trigger-automation';
import { updateDocAction } from './lib/actions/ai/update-doc';
import { listDocTablesAction } from './lib/actions/ai/list-doc-tables';
import { getTableByIdAction } from './lib/actions/ai/get-table-by-id';
import { getRowByIdAction } from './lib/actions/ai/get-row-by-id';
import { updateRowByIdAction } from './lib/actions/ai/update-row-by-id';
import { resolveBrowserLinkAction } from './lib/actions/ai/resolve-browser-link';
import { newRowCreatedTrigger } from './lib/triggers/new-row-created';

export const coda = createPiece({
	displayName: 'Coda',
	logoUrl: 'https://cdn.activepieces.com/pieces/coda.png',
	categories: [PieceCategory.PRODUCTIVITY],
	minimumSupportedRelease: '0.88.2',
	auth: codaAuth,
	authors: ['onyedikachi-david', 'kishanprmr', 'rimjhimyadav'],
	actions: [
		createRowAction,
		updateRowAction,
		upsertRowAction,
		findRowAction,
		getRowAction,
		listTablesAction,
		getTableAction,
		getCurrentUserAction,
		listDocsAction,
		getDocAction,
		createDocAction,
		updateDocAction,
		deleteDocAction,
		listFoldersAction,
		listPagesAction,
		getPageAction,
		getPageContentAction,
		createPageAction,
		updatePageAction,
		deletePageAction,
		listDocTablesAction,
		getTableByIdAction,
		listColumnsAction,
		listRowsAction,
		getRowByIdAction,
		createRowsAction,
		upsertRowsAction,
		updateRowByIdAction,
		deleteRowsAction,
		pushButtonAction,
		listFormulasAction,
		getFormulaAction,
		listControlsAction,
		getControlAction,
		getMutationStatusAction,
		resolveBrowserLinkAction,
		listPermissionsAction,
		addPermissionAction,
		removePermissionAction,
		triggerAutomationAction,
		createCustomApiCallAction({
			auth: codaAuth,
			baseUrl: () => CODA_BASE_URL,
			authMapping: async (auth) => codaApi.authHeaders(auth.secret_text),
		}),
	],
	triggers: [newRowCreatedTrigger],
});
