import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall, PaginatedResponse } from '../common';
import { spaceIdPropOptional } from '../common/props';

type ConfluencePage = {
	id: string;
	title: string;
	spaceId: string;
	status: string;
};

export const findPageByTitleAction = createAction({
	auth: confluenceAuth,
	name: 'find-page-by-title',
	displayName: 'Find Page by Title',
	description: 'Finds a page by exact title, optionally scoped to a space.',
	audience: 'both',
	aiMetadata: { description: 'Looks up Confluence pages by exact title, optionally restricted to one space, returning matches plus a found flag and count. Use to resolve a page title to its ID before reading or updating it. Match is exact (not fuzzy); for keyword or broader queries use Search Content (CQL) instead. Read-only and idempotent.', idempotent: true },
	props: {
		spaceId: spaceIdPropOptional,
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Exact title to match.',
			required: true,
		}),
	},
	async run(context) {
		const { spaceId, title } = context.propsValue;

		const query: Record<string, string> = { title, limit: '25' };
		if (spaceId) query['space-id'] = spaceId;

		const response = await confluenceApiCall<PaginatedResponse<ConfluencePage>>({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			version: 'v2',
			resourceUri: '/pages',
			query,
		});

		const results = response.results ?? [];
		return {
			found: results.length > 0,
			count: results.length,
			results,
		};
	},
});
