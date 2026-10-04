import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbGetSharedViewGroupedDataOutputSchema } from '../output-schemas';

export const getSharedViewGroupedDataAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-get-shared-view-grouped-data',
	outputSchema: nocodbGetSharedViewGroupedDataOutputSchema,
	classification: 'SEARCH',
	displayName: 'Get Shared View Grouped Data',
	description: 'Returns the records of a public shared view, grouped by the given column.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads a public shared-view link\'s records grouped by a column, without requiring an authenticated connection to the base. Needs the shared view\'s UUID (from the view\'s share link) and the column ID to group by; pass the share password if the link is password-protected. Idempotent read-only query.',
		idempotent: true,
	},
	props: {
		sharedViewUuid: Property.ShortText({
			displayName: 'Shared View UUID',
			description: 'The UUID from the view\'s public share link.',
			required: true,
		}),
		columnId: Property.ShortText({
			displayName: 'Column ID',
			description: 'The table column ID to group records by.',
			required: true,
		}),
		password: Property.ShortText({
			displayName: 'Share Password',
			description: 'Only required if the shared view link is password-protected.',
			required: false,
		}),
	},
	async run(context) {
		const { sharedViewUuid, columnId, password } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.getSharedViewGroupedData(sharedViewUuid, columnId, password);
	},
});
