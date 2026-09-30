import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { createdIssueOutputSchema } from '../../output-schemas';
export const createIssueWithFieldsAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'create_issue_with_fields',
	classification: 'WRITE',
	displayName: 'Create Issue with Fields',
	description: 'Creates an issue from a project, issue type, summary and optional fields.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Create one issue in a project with a summary, issue type and optional description, assignee, priority, labels, parent, due date and any custom fields by field ID. Get the issue type ID from Get Issue Types and the required custom fields from Get Issue Type Create Fields; for many issues at once use Bulk Create Issues. Not idempotent: each call creates a new issue.',
		idempotent: false,
	},
	outputSchema: createdIssueOutputSchema,
	props: {
		projectIdOrKey: jiraAiProps.projectIdOrKey(),
		issueTypeId: Property.ShortText({
			displayName: 'Issue Type ID',
			description: 'The numeric issue type ID. Find it with Get Issue Types.',
			required: true,
		}),
		summary: Property.ShortText({
			displayName: 'Summary',
			required: true,
		}),
		description: jiraAiProps.optionalMarkdownText({ displayName: 'Description', description: 'Issue description.' }),
		assigneeAccountId: Property.ShortText({
			displayName: 'Assignee Account ID',
			description: 'Account ID of the assignee. Resolve it with Find Users.',
			required: false,
		}),
		priorityId: Property.ShortText({
			displayName: 'Priority ID',
			description: 'The priority ID. Find it with Get Priorities.',
			required: false,
		}),
		labels: Property.Array({
			displayName: 'Labels',
			description: 'Labels to add. Labels cannot contain spaces.',
			required: false,
		}),
		parentKey: Property.ShortText({
			displayName: 'Parent Issue Key',
			description: 'Key of the parent issue or epic. Required when the issue type is a subtask.',
			required: false,
		}),
		dueDate: Property.ShortText({
			displayName: 'Due Date',
			description: 'Due date in YYYY-MM-DD format.',
			required: false,
		}),
		fields: Property.Json({
			displayName: 'Additional Fields',
			description:
				'JSON object of other field IDs to values in Jira REST format, e.g. {"customfield_10016": 5, "components": [{"id": "10000"}], "fixVersions": [{"id": "10001"}]}. Field IDs come from Get Fields or Get Issue Type Create Fields.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const fields = jiraAiHelpers.buildIssueFields({
			projectIdOrKey: propsValue.projectIdOrKey,
			issueTypeId: propsValue.issueTypeId,
			summary: propsValue.summary,
			description: propsValue.description,
			assigneeAccountId: propsValue.assigneeAccountId,
			priorityId: propsValue.priorityId,
			labels: jiraAiHelpers.toStringList({ value: propsValue.labels }),
			parentKey: propsValue.parentKey,
			dueDate: propsValue.dueDate,
			extraFields: jiraAiHelpers.toRecord({ value: propsValue.fields, label: 'Additional Fields' }),
		});
		const created = await jiraApiCall<CreatedIssue>({
			auth,
			method: HttpMethod.POST,
			resourceUri: '/issue',
			body: { fields },
		});
		return {
			id: created.id,
			key: created.key,
			self: created.self,
			browse_url: jiraAiHelpers.browseUrl({ auth, issueKey: created.key }),
		};
	},
});

type CreatedIssue = {
	id: string;
	key: string;
	self: string;
};
