import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { usersOutputSchema } from '../../output-schemas';
export const findUsersAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'find_users',
	classification: 'SEARCH',
	displayName: 'Find Users',
	description: 'Finds users by name or email.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Find users whose display name or email address matches a query, returning their account IDs, display names, active status and email when visible. The way to turn a person\'s name or email into the account ID that assign, watcher and notification actions need. Email matching depends on site privacy settings. Read-only.',
		idempotent: true,
	},
	outputSchema: usersOutputSchema,
	props: {
		query: Property.ShortText({
			displayName: 'Query',
			description: 'Text matched against display name and email address, e.g. jane or jane@example.com.',
			required: true,
		}),
		includeInactive: Property.Checkbox({
			displayName: 'Include Inactive Users',
			required: false,
			defaultValue: false,
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults({ max: 1000 }),
	},
	async run({ auth, propsValue }) {
		const users = await jiraApiCall<JiraRecord[]>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/user/search',
			query: { query: propsValue.query.trim(), startAt: propsValue.startAt, maxResults: propsValue.maxResults },
		});
		const items = propsValue.includeInactive ? users : users.filter((user) => user['active'] !== false);
		return jiraAiHelpers.toList({ items });
	},
});
