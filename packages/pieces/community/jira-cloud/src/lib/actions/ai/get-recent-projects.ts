import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { projectListOutputSchema } from '../../output-schemas';
export const getRecentProjectsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_recent_projects',
	classification: 'SEARCH',
	displayName: 'Get Recent Projects',
	description: 'Lists the projects the user viewed most recently.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List up to 20 projects the connected user viewed most recently, newest first. A quick way to guess which project the user means; use List Projects to search all projects. Read-only.',
		idempotent: true,
	},
	outputSchema: projectListOutputSchema,
	props: {},
	async run({ auth }) {
		const projects = await jiraApiCall<JiraRecord[]>({
			auth,
			method: HttpMethod.GET,
			resourceUri: '/project/recent',
			query: { expand: 'description,lead' },
		});
		return jiraAiHelpers.toList({ items: projects });
	},
});
