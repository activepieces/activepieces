import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraAiHelpers } from '../../common/ai-helpers';

import { moveIssuesToSprintOutputSchema } from '../../output-schemas';
export const moveIssuesToSprintAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'move_issues_to_sprint',
	classification: 'WRITE',
	displayName: 'Move Issues to Sprint',
	description: 'Moves up to 50 issues into a sprint.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Move up to 50 issues into an open (future or active) sprint, taking them out of the backlog or any other sprint. Closed sprints are rejected. Sprint IDs come from List Sprints. Idempotent: moving issues already in the sprint leaves them there.',
		idempotent: true,
	},
	outputSchema: moveIssuesToSprintOutputSchema,
	props: {
		sprintId: Property.Number({
			displayName: 'Sprint ID',
			description: 'The numeric ID of a future or active sprint. Find it with List Sprints.',
			required: true,
		}),
		issues: Property.Array({
			displayName: 'Issue Keys',
			description: 'Up to 50 issue keys (e.g. PROJ-123) or numeric issue IDs.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const issues = jiraAiHelpers.toStringList({ value: propsValue.issues });
		if (issues.length === 0 || issues.length > MAX_ISSUES) {
			throw new Error(`Issue Keys must contain between 1 and ${MAX_ISSUES} items.`);
		}
		await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: `${auth.props.instanceUrl}/rest/agile/1.0/sprint/${propsValue.sprintId}/issue`,
			authentication: {
				type: AuthenticationType.BASIC,
				username: auth.props.email,
				password: auth.props.apiToken,
			},
			body: { issues },
		});
		return { success: true, sprint_id: propsValue.sprintId, issues, count: issues.length };
	},
});

const MAX_ISSUES = 50;
