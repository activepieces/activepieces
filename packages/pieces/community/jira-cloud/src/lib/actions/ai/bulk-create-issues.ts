import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { bulkCreateIssuesOutputSchema } from '../../output-schemas';
export const bulkCreateIssuesAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'bulk_create_issues',
	classification: 'WRITE',
	displayName: 'Bulk Create Issues',
	description: 'Creates up to 50 issues in one request.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Create up to 50 issues in one project in a single request, each with its own summary, issue type and optional fields. Use it instead of repeated Create Issue with Fields calls when adding many issues; failures are reported per issue while the rest are still created. Not idempotent: each run creates new issues.',
		idempotent: false,
	},
	outputSchema: bulkCreateIssuesOutputSchema,
	props: {
		projectIdOrKey: jiraAiProps.projectIdOrKey({ description: 'The project key (e.g. PROJ) or numeric project ID that every issue is created in. Find it with List Projects.' }),
		issues: Property.Json({
			displayName: 'Issues',
			description:
				'JSON array (1-50 items). Each item: {"summary": string, "issueTypeId": string, "description"?: markdown string, "assigneeAccountId"?: string, "priorityId"?: string, "labels"?: string[], "parentKey"?: string, "dueDate"?: "YYYY-MM-DD", "fields"?: object of extra field IDs to values}. Issue type IDs come from Get Issue Types.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const issues = jiraAiHelpers.toRecordList({ value: propsValue.issues, label: 'Issues' });
		if (issues.length === 0 || issues.length > MAX_ISSUES) {
			throw new Error(`Issues must contain between 1 and ${MAX_ISSUES} items.`);
		}
		const issueUpdates = issues.map((issue, index) => ({
			fields: jiraAiHelpers.buildIssueFields({
				projectIdOrKey: propsValue.projectIdOrKey,
				issueTypeId: requiredText({ value: issue['issueTypeId'], label: `issues[${index}].issueTypeId` }),
				summary: requiredText({ value: issue['summary'], label: `issues[${index}].summary` }),
				description: optionalText({ value: issue['description'] }),
				assigneeAccountId: optionalText({ value: issue['assigneeAccountId'] }),
				priorityId: optionalText({ value: issue['priorityId'] }),
				labels: jiraAiHelpers.toStringList({ value: issue['labels'] }),
				parentKey: optionalText({ value: issue['parentKey'] }),
				dueDate: optionalText({ value: issue['dueDate'] }),
				extraFields: jiraAiHelpers.toRecord({ value: issue['fields'], label: `issues[${index}].fields` }),
			}),
		}));
		const response = await jiraApiCall<BulkCreateResponse>({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/issue/bulk',
			body: { issueUpdates },
		});
		const created = response.issues ?? [];
		const errors = response.errors ?? [];
		return {
			issues: created,
			errors,
			created_count: created.length,
			failed_count: errors.length,
		};
	},
});

function requiredText({ value, label }: { value: unknown; label: string }): string {
	if (typeof value !== 'string' && typeof value !== 'number') {
		throw new Error(`${label} is required.`);
	}
	return String(value);
}

function optionalText({ value }: { value: unknown }): string | undefined {
	return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

const MAX_ISSUES = 50;

type BulkCreateResponse = {
	issues?: JiraRecord[];
	errors?: JiraRecord[];
};
