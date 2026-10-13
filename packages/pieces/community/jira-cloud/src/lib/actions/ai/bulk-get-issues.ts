import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';

import { bulkGetIssuesOutputSchema } from '../../output-schemas';
export const bulkGetIssuesAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'bulk_get_issues',
	classification: 'READ',
	displayName: 'Bulk Get Issues',
	description: 'Fetches up to 100 issues by ID or key in one request.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetch up to 100 known issues by key or ID in a single request, optionally limiting the returned fields. Use it when you already hold a list of issue keys; to find issues by criteria use Search Issues by JQL. Keys that do not exist or are not visible are left out of issues without an error, so compare the returned keys with the requested ones. Read-only.',
		idempotent: true,
	},
	outputSchema: bulkGetIssuesOutputSchema,
	props: {
		issueIdsOrKeys: Property.Array({
			displayName: 'Issue IDs or Keys',
			description: 'Up to 100 issue keys (e.g. PROJ-123) or numeric issue IDs.',
			required: true,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description: 'Field IDs to return, e.g. summary, status, assignee, customfield_10016. Leave empty for all navigable fields.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const issueIdsOrKeys = jiraAiHelpers.toStringList({ value: propsValue.issueIdsOrKeys });
		if (issueIdsOrKeys.length === 0 || issueIdsOrKeys.length > MAX_ISSUES) {
			throw new Error(`Issue IDs or Keys must contain between 1 and ${MAX_ISSUES} items.`);
		}
		const fields = jiraAiHelpers.toStringList({ value: propsValue.fields });
		const response = await jiraApiCall<BulkFetchResponse>({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/issue/bulkfetch',
			body: {
				issueIdsOrKeys,
				...(fields.length > 0 ? { fields } : {}),
			},
		});
		const issues = response.issues ?? [];
		return { issues, issue_errors: response.issueErrors ?? [], count: issues.length };
	},
});

const MAX_ISSUES = 100;

type BulkFetchResponse = {
	issues?: JiraRecord[];
	issueErrors?: JiraRecord[];
};
