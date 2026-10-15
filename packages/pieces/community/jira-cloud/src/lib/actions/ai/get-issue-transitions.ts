import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { issueTransitionsOutputSchema } from '../../output-schemas';
export const getIssueTransitionsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'get_issue_transitions',
	classification: 'READ',
	displayName: 'Get Issue Transitions',
	description: 'Lists the workflow transitions available on an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'List the workflow transitions the connected user can perform on an issue from its current status, each with its numeric ID, name and target status. Call it before Transition Issue Status, which needs the numeric transition ID rather than a status name. Read-only.',
		idempotent: true,
	},
	outputSchema: issueTransitionsOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		includeFields: Property.Checkbox({
			displayName: 'Include Transition Screen Fields',
			description: 'Also return the fields shown on each transition screen, such as a required resolution.',
			required: false,
			defaultValue: false,
		}),
	},
	async run({ auth, propsValue }) {
		const response = await jiraApiCall<{ transitions?: JiraRecord[] }>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/transitions`,
			query: { expand: propsValue.includeFields ? 'transitions.fields' : undefined },
		});
		return jiraAiHelpers.toList({ items: response.transitions ?? [] });
	},
});
