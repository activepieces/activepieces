import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { projectOutputSchema } from '../../output-schemas';
export const getProjectAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_project',
	classification: 'READ',
	displayName: 'Get Project',
	description: 'Gets the details of a project.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetch one project by key or ID, including its numeric ID, name, description, lead, project type, issue types, components and versions. Use List Projects to find a project by name. Read-only.',
		idempotent: true,
	},
	outputSchema: projectOutputSchema,
	props: {
		projectIdOrKey: jiraAiProps.projectIdOrKey(),
	},
	async run({ auth, propsValue }) {
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/project/${encodeURIComponent(propsValue.projectIdOrKey.trim())}`,
			query: { expand: 'description,lead,issueTypes,url' },
		});
	},
});
