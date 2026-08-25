import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { jiraApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findUserAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'find-user',
	displayName: 'Find User',
	description: 'Finds an existing user.',
	audience: 'both',
	aiMetadata: {
		description:
			'Searches Jira Data Center/Server users by a keyword (matched against username) and returns the matching accounts. Use to resolve a person to a Jira user before assigning an issue or adding a watcher. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		keyword: Property.ShortText({
			displayName: 'Keyword',
			required: true,
		}),
	},
	async run(context) {
		const response = await jiraApiCall<Array<Record<string, unknown>>>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: '/user/search',
			query: {
				username: context.propsValue.keyword,
			},
		});

		return {
			found: response.length > 0,
			data: response,
		};
	},
});
