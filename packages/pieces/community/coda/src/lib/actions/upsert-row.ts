import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../..';
import { codaClient } from '../common/types';
import {
	columnIdsDropdown,
	docIdDropdown,
	tableIdDropdown,
	tableRowsDynamicProps,
} from '../common/props';

export const upsertRowAction = createAction({
	auth: codaAuth,
	name: 'upsert-row',
	displayName: 'Upsert Row',
	description: 'Creates a new row or updates an existing one if it matches key columns.',
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
		keyColumns: columnIdsDropdown('Matching Columns', false),
		rowData: tableRowsDynamicProps,
	},
	async run(context) {
		const { docId, tableId, rowData, keyColumns } = context.propsValue;
		const client = codaClient(context.auth as string);

		const cells = Object.entries(rowData as Record<string, any>)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([columnId, value]) => ({
				column: columnId,
				value: value,
			}));

		const payload = {
			rows: [
				{
					cells: cells,
				},
			],
			keyColumns: keyColumns as string[],
		};

		const response = await client.mutateRows(docId, tableId, payload, {
			disableParsing: false,
		});

		if (!response.requestId) {
			throw new Error(`Unexpected error occured : ${JSON.stringify(response)}`);
		}

		return { success: true };
	},
});
