import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbResultOutputSchema } from '../output-schemas';

export const deleteViewAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-delete-view',
	outputSchema: nocodbResultOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete View',
	description: 'Deletes the given view.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes a view by its ID. Only removes the view itself, not the underlying table or its records. Not idempotent: deleting an already-deleted view fails.',
		idempotent: false,
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
		return await client.deleteView(viewId);
	},
});
