import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { sprintOutputSchema } from '../../output-schemas';
export const createSprintAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'create_sprint',
	classification: 'WRITE',
	displayName: 'Create Sprint',
	description: 'Creates a future sprint on a Scrum board.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Create a sprint on a Scrum board with optional start date, end date and goal. The sprint is always created in the future state; starting it is done in Jira. Board IDs come from List Boards. Not idempotent: each call creates another sprint.',
		idempotent: false,
	},
	outputSchema: sprintOutputSchema,
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			required: true,
		}),
		originBoardId: Property.Number({
			displayName: 'Board ID',
			description: 'The numeric ID of the Scrum board. Find it with List Boards.',
			required: true,
		}),
		startDate: Property.DateTime({
			displayName: 'Start Date',
			description: 'Planned start (ISO 8601).',
			required: false,
		}),
		endDate: Property.DateTime({
			displayName: 'End Date',
			description: 'Planned end (ISO 8601).',
			required: false,
		}),
		goal: Property.LongText({
			displayName: 'Goal',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const response = await httpClient.sendRequest<JiraRecord>({
			method: HttpMethod.POST,
			url: `${auth.props.instanceUrl}/rest/agile/1.0/sprint`,
			authentication: {
				type: AuthenticationType.BASIC,
				username: auth.props.email,
				password: auth.props.apiToken,
			},
			body: {
				name: propsValue.name,
				originBoardId: propsValue.originBoardId,
				...(jiraAiHelpers.isProvided(propsValue.startDate) ? { startDate: propsValue.startDate } : {}),
				...(jiraAiHelpers.isProvided(propsValue.endDate) ? { endDate: propsValue.endDate } : {}),
				...(jiraAiHelpers.isProvided(propsValue.goal) ? { goal: propsValue.goal } : {}),
			},
		});
		return response.body;
	},
});
