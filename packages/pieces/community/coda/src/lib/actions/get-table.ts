import { codaAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { docIdDropdown, tableIdDropdown } from '../common/props';
import { codaClient } from '../common/types';

export const getTableAction = createAction({
	auth: codaAuth,
	name: 'get-table',
	displayName: 'Get Table',
	description: 'Get structure and details of a specific table (e.g., columns, schema).',
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
	},
	async run(context) {
		const { docId, tableId } = context.propsValue;
		const client = codaClient(context.auth);

		return await client.getTableDetails(docId, tableId, {});
	},
});
