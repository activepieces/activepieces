import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { prioritiesOutputSchema } from '../../output-schemas';
export const getPrioritiesAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_priorities',
	classification: 'SEARCH',
	displayName: 'Get Priorities',
	description: 'Lists the issue priorities.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the issue priorities (e.g. Highest, High, Medium, Low) with their IDs, optionally limited to those available in one project. Use it to get the priority ID that Create Issue with Fields and Edit Issue expect. Read-only.',
		idempotent: true,
	},
	outputSchema: prioritiesOutputSchema,
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'Only return priorities available in this project. Must be the numeric project ID (see Get Project); leave empty for all.',
			required: false,
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults(),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<JiraPageBean<JiraRecord>>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/priority/search',
			query: { projectId: propsValue.projectId, startAt: propsValue.startAt, maxResults: propsValue.maxResults },
		});
		return jiraAiHelpers.toPage({
			items: response.values ?? [],
			startAt: response.startAt,
			maxResults: response.maxResults,
			total: response.total,
			isLast: response.isLast,
		});
	},
});
