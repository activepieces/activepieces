import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbResultOutputSchema } from '../output-schemas';

export const updateViewColumnAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-update-view-column',
	outputSchema: nocodbResultOutputSchema,
	classification: 'WRITE',
	displayName: 'Update View Column',
	description: 'Shows, hides, or reorders a column within a view.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Updates a column\'s visibility and/or order within a specific view, identified by the view-scoped column ID from List View Columns (not the table column ID). Use to curate what an agent or user sees in a view. Idempotent: re-applying the same show/order state yields the same result.',
		idempotent: true,
	},
	props: {
		viewId: Property.ShortText({
			displayName: 'View ID',
			required: true,
		}),
		columnId: Property.ShortText({
			displayName: 'View Column ID',
			description: 'The view-scoped column ID from List View Columns, not the table column ID.',
			required: true,
		}),
		show: Property.Checkbox({
			displayName: 'Show',
			required: false,
		}),
		order: Property.Number({
			displayName: 'Order',
			required: false,
		}),
	},
	async run(context) {
		const { viewId, columnId, show, order } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.updateViewColumn(viewId, columnId, { show, order });
	},
});
