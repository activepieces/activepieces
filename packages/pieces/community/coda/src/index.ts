import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { findRowAction } from './lib/actions/find-row';
import { createRowAction } from './lib/actions/create-row';
import { upsertRowAction } from './lib/actions/upsert-row';
import { updateRowAction } from './lib/actions/update-row';
import { newRowCreatedTrigger } from './lib/triggers/new-row-created';
import { PieceCategory } from '@activepieces/shared';
import { getRowAction } from './lib/actions/get-row';
import { listTablesAction } from './lib/actions/list-tables';
import { getTableAction } from './lib/actions/get-table';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { CODA_BASE_URL } from './lib/common/types';

export const codaAuth = PieceAuth.SecretText({
	displayName: 'Coda API Key',
	description: `Create an API key in the [Coda Account dashboard](https://coda.io/account).`,
	required: true,
});

export const coda = createPiece({
	displayName: 'Coda',
	logoUrl: 'https://cdn.activepieces.com/pieces/coda.png',
	categories: [PieceCategory.PRODUCTIVITY],
	auth: codaAuth,
	authors: ['onyedikachi-david', 'kishanprmr','rimjhimyadav'],
	actions: [
		createRowAction,
		updateRowAction,
		upsertRowAction,
		findRowAction,
		getRowAction,
		listTablesAction,
		getTableAction,
		createCustomApiCallAction({
			auth:codaAuth,
			baseUrl:()=>CODA_BASE_URL,
			authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),


		})
	],
	triggers: [newRowCreatedTrigger],
});
