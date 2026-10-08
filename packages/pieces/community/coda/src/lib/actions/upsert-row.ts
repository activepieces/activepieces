import { createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaClient } from '../common/types';
import {
	columnIdsDropdown,
	docIdDropdown,
	tableIdDropdown,
	tableRowsDynamicProps,
} from '../common/props';
import { upsertRowActionOutputSchema } from '../output-schemas';

export const upsertRowAction = createAction({
	auth: codaAuth,
	name: 'upsert-row',
	classification: 'WRITE',
	displayName: 'Upsert Row',
	description: 'Creates a new row or updates an existing one if it matches key columns.',
	audience: 'human',
	aiMetadata: { description: 'Insert a row into a Coda table, or update an existing row when its values match the chosen key columns. Use when you want create-or-update semantics keyed on stable columns rather than a known row ID. Idempotent when key columns uniquely identify a row — repeating the same input converges to one matching row; with no matching columns it behaves like an insert.', idempotent: true },
	props: {
		docId: docIdDropdown,
		tableId: tableIdDropdown,
		keyColumns: columnIdsDropdown('Matching Columns', false),
		rowData: tableRowsDynamicProps,
	},
	outputSchema: upsertRowActionOutputSchema,
	async run(context) {
		const { docId, tableId, rowData, keyColumns } = context.propsValue;
		const client = codaClient(context.auth);

		const cells = Object.entries(rowData ?? {})
			.filter(([, value]) => value !== undefined && value !== null && value !== '')
			.map(([columnId, value]) => ({
				column: columnId,
				value: value,
			}));

		if (cells.length === 0) {
			throw new Error('Provide at least one column value to upsert the row.');
		}
		const matchingColumns = Array.isArray(keyColumns) ? keyColumns : keyColumns ? [keyColumns] : [];
		const filledColumns = new Set(cells.map((cell) => cell.column));
		const missingKeys = matchingColumns.filter((column) => !filledColumns.has(column));
		if (missingKeys.length > 0) {
			throw new Error(
				`Every matching column needs a value in Row Data, otherwise Coda cannot find the existing row. Missing values for: ${missingKeys.join(', ')}.`,
			);
		}

		const payload = {
			rows: [
				{
					cells: cells,
				},
			],
			keyColumns: matchingColumns,
		};

		const response = await client.mutateRows(docId, tableId, payload, {
			disableParsing: false,
		});

		if (!response.requestId) {
			throw new Error(`Unexpected error occured : ${JSON.stringify(response)}`);
		}

		return { success: true, requestId: response.requestId };
	},
});
