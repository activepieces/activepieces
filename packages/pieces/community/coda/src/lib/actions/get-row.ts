import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../..';
import { codaClient } from '../common/types';
import { docIdDropdown, tableIdDropdown } from '../common/props';

export const getRowAction = createAction({
	auth: codaAuth,
	name: 'get-row',
	displayName: 'Get Row',
	description: 'Retrieves a single row by specified ID.',
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
		rowIdOrName: Property.ShortText({
			displayName: 'Row ID or Name',
			required: true,
		}),
	},
	async run(context) {
		const { docId, tableId, rowIdOrName } = context.propsValue;
		const client = codaClient(context.auth);

		return await client.getRow(docId, tableId, rowIdOrName, {
			useColumnNames: true,
			valueFormat: 'simpleWithArrays',
		});
	},
});
