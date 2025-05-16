import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../..';
import { codaClient } from '../common/types';
import { docIdDropdown, tableIdDropdown, tableRowsDynamicProps } from '../common/props';
import { isNil } from '@activepieces/shared';

export const createRowAction = createAction({
	auth: codaAuth,
	name: 'create-row',
	displayName: 'Create Row',
	description: 'Creates a new row in the selected table.',
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
		rowData: tableRowsDynamicProps,
	},
	async run(context) {
		const { docId, tableId, rowData } = context.propsValue;
		const client = codaClient(context.auth);

		const cells = Object.entries(rowData as Record<string, any>)
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([columnId, value]) => ({
				column: columnId,
				value: value,
			}));

		if (cells.length === 0) {
			throw new Error('Provide any column values to create new row.');
		}

		const payload = {
			rows: [
				{
					cells: cells,
				},
			],
		};

		const response = await client.mutateRows(docId, tableId, payload, {
			disableParsing: false,
		});

		const rowId = response.addedRowIds?.[0];

		if (isNil(rowId)) {
			throw new Error(`Unexpected error occured : ${JSON.stringify(response)}`);
		}

		return { rowId };
	},
});
