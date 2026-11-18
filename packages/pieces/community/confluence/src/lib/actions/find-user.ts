import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { findUserOutputSchema } from '../output-schemas';

export const findUserAction = createAction({
	auth: confluenceAuth,
	name: 'find-user',
	outputSchema: findUserOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find User',
	description: 'Looks up Confluence users by name, email, or keyword.',
	audience: 'both',
	aiMetadata: { description: 'Searches Confluence users by a keyword matched against full name and username (via CQL), returning matching user records plus a found flag and count. Use to resolve a person\'s name or email to a Confluence user/account ID. Read-only and idempotent.', idempotent: true },
	props: {
		keyword: Property.ShortText({
			displayName: 'Keyword',
			description: 'Username, email, or display name to search for.',
			required: true,
		}),
		limit: Property.Number({
			displayName: 'Limit',
			required: false,
			defaultValue: 25,
		}),
	},
	async run(context) {
		const { keyword, limit } = context.propsValue;

		const users = await confluenceApi.searchUsers({ auth: context.auth, keyword, limit });
		return {
			found: users.length > 0,
			count: users.length,
			results: users,
		};
	},
});
