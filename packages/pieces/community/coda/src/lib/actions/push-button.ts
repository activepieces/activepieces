import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { pushButtonActionOutputSchema } from '../output-schemas';

export const pushButtonAction = createAction({
	auth: codaAuth,
	name: 'push_button',
	classification: 'WRITE',
	displayName: 'Push Button',
	description: 'Presses a button in a table row, running whatever action the button is set up to do. If the button is disabled for that row, Coda accepts the press but nothing happens.',
	audience: 'both',
	aiMetadata: {
		description: 'Presses the button in one row\'s button column, which runs the action the doc owner configured (it can edit rows, send notifications or call Packs). Use only when the user asks to press that button. A button disabled for that row is accepted but does nothing; check the row afterwards if the outcome matters. Not idempotent: each press runs the action again.',
		idempotent: false,
	},
	props: {
		docId: codaProps.docId(),
		tableIdOrName: codaProps.tableIdOrName(),
		rowIdOrName: codaProps.rowIdOrName(),
		columnIdOrName: Property.ShortText({
			displayName: 'Button Column ID or Name',
			description: 'The button column (List Columns shows it with type "button").',
			required: true,
		}),
		waitForCompletion: codaProps.waitForCompletion(),
	},
	outputSchema: pushButtonActionOutputSchema,
	async run(context) {
		const { docId, tableIdOrName, rowIdOrName, columnIdOrName, waitForCompletion } = context.propsValue;
		const token = context.auth.secret_text;
		const response = await codaApi.request<{ requestId?: string; rowId?: string; columnId?: string }>({
			token,
			method: HttpMethod.POST,
			path: `${codaApi.tablePath({ docId, tableIdOrName })}/rows/${codaApi.pathSegment({ value: rowIdOrName, label: 'Row ID' })}/buttons/${codaApi.pathSegment({ value: columnIdOrName, label: 'Button column' })}`,
			operation: 'push button',
		});
		const mutation = await codaApi.settleMutation({ token, requestId: response.requestId, waitForCompletion });
		return { rowId: response.rowId ?? rowIdOrName, columnId: response.columnId ?? columnIdOrName, ...mutation };
	},
});
