import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { issueOutputSchema } from '../../output-schemas';
export const fetchIssueAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'fetch_issue',
	classification: 'READ',
	displayName: 'Fetch Issue',
	description: 'Gets an issue by key or ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetch one issue by key or ID with its fields (status, assignee, priority, description, attachments, issue links, custom fields), optionally limited to chosen fields and expanded with rendered HTML, field names, transitions or changelog. Use it when you know the issue; to find issues by criteria use Search Issues by JQL. Read-only.',
		idempotent: true,
	},
	outputSchema: issueOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Field IDs to return, e.g. summary, status, customfield_10016. Leave empty for all fields.',
			required: false,
		}),
		expand: Property.StaticMultiSelectDropdown({
			displayName: 'Expand',
			required: false,
			options: {
				options: [
					{ label: 'Rendered Fields (HTML)', value: 'renderedFields' },
					{ label: 'Field Names', value: 'names' },
					{ label: 'Transitions', value: 'transitions' },
					{ label: 'Changelog', value: 'changelog' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const fields = jiraAiHelpers.toStringList({ value: propsValue.fields });
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}`,
			query: {
				fields: fields.length > 0 ? fields : undefined,
				expand: propsValue.expand,
			},
		});
	},
});
