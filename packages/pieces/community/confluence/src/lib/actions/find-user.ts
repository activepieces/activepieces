import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { confluenceAuth } from '../auth';
import { confluenceApiCall } from '../common';

type UserSearchResult = {
	results: Array<{ user: Record<string, unknown> }>;
	totalSize?: number;
};

export const findUserAction = createAction({
	auth: confluenceAuth,
	name: 'find-user',
	displayName: 'Find User',
	description: 'Looks up Confluence users by name, email, or keyword.',
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

		const cql = `user.fullname ~ "${keyword.replace(/"/g, '\\"')}" OR user = "${keyword.replace(/"/g, '\\"')}"`;

		const response = await confluenceApiCall<UserSearchResult>({
			domain: context.auth.props.confluenceDomain,
			username: context.auth.props.username,
			password: context.auth.props.password,
			method: HttpMethod.GET,
			version: 'v1',
			resourceUri: '/search/user',
			query: {
				cql,
				limit: String(limit ?? 25),
			},
		});

		const users = (response.results ?? []).map((r) => r.user);
		return {
			found: users.length > 0,
			count: users.length,
			results: users,
		};
	},
});
