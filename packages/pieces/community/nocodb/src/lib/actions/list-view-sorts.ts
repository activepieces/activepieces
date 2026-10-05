import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbListViewSortsOutputSchema } from '../output-schemas';

export const listViewSortsAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-list-view-sorts',
	outputSchema: nocodbListViewSortsOutputSchema,
	classification: 'READ',
	displayName: 'List View Sorts',
	description: 'Returns the sort rules configured on the given view.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the field/direction sort rules applied to a view. Use to inspect a view\'s current ordering before changing it. Idempotent read-only query.',
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
		return await client.listViewSorts(viewId);
	},
});
