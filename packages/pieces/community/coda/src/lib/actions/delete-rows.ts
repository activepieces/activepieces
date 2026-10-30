import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { rowInput } from '../common/row-input';
import { deleteRowsActionOutputSchema } from '../output-schemas';

export const deleteRowsAction = createAction({
	auth: codaAuth,
	name: 'delete_rows',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Rows',
	description: 'Permanently deletes rows from a table by row ID.',
	audience: 'both',
	aiMetadata: {
		description: 'Permanently deletes 1-500 rows (by row ID) from a Coda table or view. Use only when the user asks to remove rows; get the IDs from List Rows first. Row IDs that no longer exist are ignored, so a repeat call leaves the same end state and it is idempotent.',
		idempotent: true,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
		rowIds: Property.Array({
			displayName: 'Row IDs',
			description: 'IDs of the rows to delete (they start with "i-").',
			required: true,
		}),
		waitForCompletion: codaProps.waitForCompletion(),
	},
	outputSchema: deleteRowsActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName, rowIds, waitForCompletion } = context.propsValue;
		const ids = rowInput.toStringList({ value: rowIds, label: 'Row IDs' });
		if (ids.length === 0) {
			throw new Error('Give at least one row ID to delete.');
		}
		if (ids.length > rowInput.MAX_ROWS_PER_REQUEST) {
			throw new Error(`At most ${rowInput.MAX_ROWS_PER_REQUEST} rows can be deleted per call.`);
		}
		const token = context.auth.secret_text;
		const response = await codaApi.request<{ requestId?: string; rowIds?: string[] }>({
			token,
			method: HttpMethod.DELETE,
			path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows`,
			operation: 'delete rows',
			body: { rowIds: ids },
		});
		const mutation = await codaApi.settleMutation({ token, requestId: response.requestId, waitForCompletion });
		return { rowIds: response.rowIds ?? ids, ...mutation };
	},
});
