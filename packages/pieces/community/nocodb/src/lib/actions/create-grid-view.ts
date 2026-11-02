import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbCreateGridViewOutputSchema } from '../output-schemas';

export const createGridViewAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-create-grid-view',
	outputSchema: nocodbCreateGridViewOutputSchema,
	classification: 'WRITE',
	displayName: 'Create Grid View',
	description: 'Creates a new grid view on the given table.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a new grid view on a table with the given title. Use when an agent needs a dedicated view to configure (columns, sort) separately from the table\'s default view. Not idempotent: each call creates another view.',
		idempotent: false,
	},
	props: {
		tableId: Property.ShortText({
			displayName: 'Table ID',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
		}),
	},
	async run(context) {
		const { tableId, title } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.createGridView(tableId, title);
	},
});
