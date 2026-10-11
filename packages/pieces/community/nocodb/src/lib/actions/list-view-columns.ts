import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbListViewColumnsOutputSchema } from '../output-schemas';

export const listViewColumnsAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-list-view-columns',
	outputSchema: nocodbListViewColumnsOutputSchema,
	classification: 'READ',
	displayName: 'List View Columns',
	description: 'Returns the columns configured on the given view, with their view-scoped column IDs.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists a view\'s columns along with their visibility, order, and view-scoped column ID. That ID is required by Update View Column and is different from the table column ID returned by Get Table Schema. Idempotent read-only query.',
		idempotent: true,
	},
	props: {
		viewId: Property.ShortText({
			displayName: 'View ID',
			required: true,
		}),
	},
	async run(context) {
		const { viewId } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.listViewColumns(viewId);
	},
});
