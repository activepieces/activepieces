import { createAction, Property } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatOutputSchemas } from '../common/output-schemas';

export const findUserByNameAction = createAction({
	auth: manychatAuth,
	name: 'findUserByName',
	classification: 'SEARCH',
	displayName: 'Find User by Name',
	description: 'Finds users by full name. ManyChat returns at most 100 matches.',
	audience: 'both',
	aiMetadata: {
		description:
			'Searches ManyChat subscribers by full name and returns whether any matched plus up to 100 matches (ManyChat limit, no paging). Use when you only know the contact name; for email or phone use "Find Subscriber by Email or Phone". Read-only.',
		idempotent: true,
	},
	outputSchema: manychatOutputSchemas.searchResult,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: "Provide user's full name to search.",
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const body = await manychatClient.request({
			apiKey: manychatUtils.apiKeyOf(auth),
			method: 'GET',
			path: '/subscriber/findByName',
			operation: 'find subscribers by name',
			query: { name: propsValue.name },
		});
		const result = manychatUtils.recordsOf(manychatUtils.dataOf(body));
		return { found: result.length > 0, result };
	},
});
