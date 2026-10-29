import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { rowInput } from '../common/row-input';
import { createRowsActionOutputSchema } from '../output-schemas';

export const createRowsAction = createAction({
	auth: codaAuth,
	name: 'create_rows',
	classification: 'WRITE',
	displayName: 'Add Rows',
	description: 'Adds one or more rows to a table, each given as column → value.',
	audience: 'both',
	aiMetadata: {
		description: 'Adds 1-500 new rows to a Coda base table (not a view), each given as an object of column name or ID → value, and by default waits until Coda has applied them. Use Upsert Rows instead when rows may already exist. Not idempotent: each call inserts new rows.',
		idempotent: false,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
		rows: Property.Json({
			displayName: 'Rows',
			description: 'A list of rows, each an object of column name or ID → value. Example: [{"Name": "Ada", "Amount": 5, "Done": false}]',
			required: true,
			defaultValue: [{ Name: 'Example' }],
		}),
		disableParsing: Property.Checkbox({
			displayName: 'Store Values Exactly as Given',
			description: 'When on, Coda does not convert text like "5" or "2026-01-31" into numbers or dates.',
			required: false,
			defaultValue: false,
		}),
		waitForCompletion: codaProps.waitForCompletion(),
	},
	outputSchema: createRowsActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName, rows, disableParsing, waitForCompletion } = context.propsValue;
		const rowList = rowInput.toRows({ value: rows, label: 'Rows' });
		const payload = { rows: rowList.map((row, index) => ({ cells: rowInput.insertCells({ row, rowNumber: index + 1 }) })) };
		const token = context.auth.secret_text;
		const response = await codaApi.request<{ requestId?: string; addedRowIds?: string[] }>({
			token,
			method: HttpMethod.POST,
			path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows`,
			operation: 'add rows',
			query: { disableParsing: disableParsing === true ? true : undefined },
			body: payload,
		});
		const mutation = await codaApi.settleMutation({ token, requestId: response.requestId, waitForCompletion });
		return { addedRowIds: response.addedRowIds ?? [], ...mutation };
	},
});
