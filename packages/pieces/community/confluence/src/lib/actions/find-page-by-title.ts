import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { findPageByTitleOutputSchema } from '../output-schemas';

export const findPageByTitleAction = createAction({
	auth: confluenceAuth,
	name: 'find-page-by-title',
	outputSchema: findPageByTitleOutputSchema,
	classification: 'SEARCH',
	displayName: 'Find Page by Title',
	description: 'Finds a page by exact title, optionally scoped to a space.',
	audience: 'human',
	aiMetadata: { description: 'Looks up Confluence pages by exact title, optionally restricted to one space, returning matches plus a found flag and count. Use to resolve a page title to its ID before reading or updating it. Match is exact (not fuzzy); for keyword or broader queries use Search Content (CQL) instead. Read-only and idempotent.', idempotent: true },
	props: {
		spaceId: confluenceProps.spaceId({ required: false }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Exact title to match.',
			required: true,
		}),
	},
	async run(context) {
		const { spaceId, title } = context.propsValue;

		const results = await confluenceApi.findPagesByTitle({ auth: context.auth, title, spaceId });
		return {
			found: results.length > 0,
			count: results.length,
			results,
		};
	},
});
