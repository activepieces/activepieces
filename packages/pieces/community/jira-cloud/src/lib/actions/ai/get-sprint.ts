import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { JiraRecord } from '../../common/ai-helpers';

import { sprintOutputSchema } from '../../output-schemas';
export const getSprintAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_sprint',
	classification: 'READ',
	displayName: 'Get Sprint',
	description: 'Gets the details of a sprint.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetch one sprint by its numeric ID, including name, state, start, end and completion dates, goal and board. Use List Sprints to find sprint IDs. Read-only.',
		idempotent: true,
	},
	outputSchema: sprintOutputSchema,
	props: {
		sprintId: Property.Number({
			displayName: 'Sprint ID',
			description: 'The numeric sprint ID. Find it with List Sprints.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const response = await httpClient.sendRequest<JiraRecord>({
			method: HttpMethod.GET,
			url: `${auth.props.instanceUrl}/rest/agile/1.0/sprint/${propsValue.sprintId}`,
			authentication: {
				type: AuthenticationType.BASIC,
				username: auth.props.email,
				password: auth.props.apiToken,
			},
		});
		return response.body;
	},
});
