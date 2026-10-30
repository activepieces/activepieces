import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../../auth';
import { codaApi } from '../../common/client';
import { codaProps } from '../../common/ai-props';
import { rowInput } from '../../common/row-input';
import { updateRowByIdActionOutputSchema } from '../../output-schemas';

export const updateRowByIdAction = createAction({
	auth: codaAuth,
	name: 'update_row_by_id',
	classification: 'WRITE',
	displayName: 'Update Row (by ID)',
	description: 'Changes cells of one row by row ID.',
	audience: 'ai',
	aiMetadata: {
		description: 'Changes cells of one Coda row by row ID; columns you leave out stay as they are, and null or "" clears a cell. Use after List Rows or Get Row; calculated columns cannot be written. Setting the same values again changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
		rowIdOrName: codaProps.rowIdOrName(),
		cells: Property.Json({
			displayName: 'Cells',
			description: 'Object of column name or ID → new value. Use null or "" to clear a cell. Example: {"Status": "Closed", "Notes": null}',
			required: true,
			defaultValue: { Name: 'New value' },
		}),
		disableParsing: Property.Checkbox({
			displayName: 'Store Values Exactly as Given',
			required: false,
			defaultValue: false,
		}),
		waitForCompletion: codaProps.waitForCompletion(),
	},
	outputSchema: updateRowByIdActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName, rowIdOrName, cells, disableParsing, waitForCompletion } = context.propsValue;
		const edits = rowInput.updateCells(rowInput.toRecord({ value: cells, label: 'Cells' }));
		const token = context.auth.secret_text;
		const response = await codaApi.request<{ requestId?: string; id?: string }>({
			token,
			method: HttpMethod.PUT,
			path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows/${codaApi.pathSegment({ value: rowIdOrName, label: 'Row ID' })}`,
			operation: 'update row',
			query: { disableParsing: disableParsing === true ? true : undefined },
			body: { row: { cells: edits } },
		});
		const mutation = await codaApi.settleMutation({ token, requestId: response.requestId, waitForCompletion });
		return { id: response.id ?? rowIdOrName, ...mutation };
	},
});
