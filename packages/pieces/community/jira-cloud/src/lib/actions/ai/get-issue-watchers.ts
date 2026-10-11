import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { issueWatchersOutputSchema } from '../../output-schemas';
export const getIssueWatchersAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_issue_watchers',
	classification: 'SEARCH',
	displayName: 'Get Issue Watchers',
	description: 'Lists the users watching an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the users watching an issue, with their account IDs and whether the connected user is one of them. Use it before Add Watcher or Remove Watcher to check the current list. Watcher details may be hidden by site privacy settings. Read-only.',
		idempotent: true,
	},
	outputSchema: issueWatchersOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<WatchersResponse>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/watchers`,
		});
		return {
			...jiraAiHelpers.toList({ items: response.watchers ?? [] }),
			watch_count: response.watchCount ?? null,
			is_watching: response.isWatching ?? null,
		};
	},
});

type WatchersResponse = {
	watchers?: JiraRecord[];
	watchCount?: number;
	isWatching?: boolean;
};
