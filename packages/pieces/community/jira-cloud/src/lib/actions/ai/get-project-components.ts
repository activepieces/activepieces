import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraPageBean, JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { componentsOutputSchema } from '../../output-schemas';
export const getProjectComponentsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_project_components',
	classification: 'SEARCH',
	displayName: 'Get Project Components',
	description: 'Lists the components of a project.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the components of one project, optionally filtered by name or description text, with their IDs, leads and issue counts. Use it to find component IDs for the components field of Create Issue with Fields or Edit Issue. Read-only.',
		idempotent: true,
	},
	outputSchema: componentsOutputSchema,
	props: {
		projectIdOrKey: jiraAiProps.projectIdOrKey(),
		query: Property.ShortText({
			displayName: 'Query',
			description: 'Only return components whose name or description contains this text.',
			required: false,
		}),
		startAt: jiraAiProps.startAt(),
		maxResults: jiraAiProps.maxResults(),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<JiraPageBean<JiraRecord>>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/project/${encodeURIComponent(propsValue.projectIdOrKey.trim())}/component`,
			query: { query: propsValue.query, startAt: propsValue.startAt, maxResults: propsValue.maxResults },
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
