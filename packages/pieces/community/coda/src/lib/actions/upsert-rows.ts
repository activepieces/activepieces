import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { rowInput } from '../common/row-input';
import { upsertRowsActionOutputSchema } from '../output-schemas';

export const upsertRowsAction = createAction({
	auth: codaAuth,
	name: 'upsert_rows',
	classification: 'WRITE',
	displayName: 'Upsert Rows',
	description: 'Updates rows whose key columns match, and adds the rest as new rows.',
	audience: 'both',
	aiMetadata: {
		description: 'Inserts rows or updates existing ones whose key-column values match; every matching row is updated, so pick key columns that are unique. Each row must include all key columns. Use for create-or-update sync on stable keys. Repeating the same input converges to the same rows, so it is idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
		keyColumns: Property.Array({
			displayName: 'Key Columns',
			description: 'Column names or IDs that identify a row, for example Email.',
			required: true,
		}),
		rows: Property.Json({
			displayName: 'Rows',
			description: 'A list of rows, each an object of column name or ID → value, including every key column. Example: [{"Email": "ada@example.com", "Amount": 5}]',
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
	outputSchema: upsertRowsActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName, keyColumns, rows, disableParsing, waitForCompletion } = context.propsValue;
		const keys = rowInput.toStringList({ value: keyColumns, label: 'Key Columns' });
		if (keys.length === 0) {
			throw new Error('Give at least one key column. Use Add Rows if you only want to insert.');
		}
		const rowList = rowInput.toRows({ value: rows, label: 'Rows' });
		rowList.forEach((row, index) => {
			const missing = keys.filter((key) => !rowInput.hasValue(row[key]));
			if (missing.length > 0) {
				throw new Error(`Row ${index + 1} has no value for key column(s) ${missing.join(', ')}. Use the same column names or IDs in Rows as in Key Columns.`);
			}
		});
		const token = context.auth.secret_text;
		const response = await codaApi.request<{ requestId?: string }>({
			token,
			method: HttpMethod.POST,
			path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows`,
			operation: 'upsert rows',
			query: { disableParsing: disableParsing === true ? true : undefined },
			body: {
				rows: rowList.map((row, index) => ({ cells: rowInput.insertCells({ row, rowNumber: index + 1 }) })),
				keyColumns: keys,
			},
		});
		const mutation = await codaApi.settleMutation({ token, requestId: response.requestId, waitForCompletion });
		return { rowCount: rowList.length, ...mutation };
	},
});
