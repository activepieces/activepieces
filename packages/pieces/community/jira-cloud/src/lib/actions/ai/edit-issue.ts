import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { issueOutputSchema } from '../../output-schemas';
export const editIssueAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'edit_issue',
	classification: 'WRITE',
	displayName: 'Edit Issue',
	description: 'Updates only the given fields of an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Update selected fields of an existing issue: summary, description, assignee, priority, labels, parent, due date, issue type or any field by ID. Only the fields you supply change; everything else is left alone, and labels replace the current list. Status is not a field, use Transition Issue Status for that. Idempotent: applying the same values again changes nothing.',
		idempotent: true,
	},
	outputSchema: issueOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		summary: Property.ShortText({
			displayName: 'Summary',
			required: false,
		}),
		description: jiraAiProps.optionalMarkdownText({ displayName: 'Description', description: 'New issue description, replacing the current one.' }),
		assigneeAccountId: Property.ShortText({
			displayName: 'Assignee Account ID',
			description: 'Account ID of the new assignee. Resolve it with Find Users; to unassign use Assign Issue to User.',
			required: false,
		}),
		priorityId: Property.ShortText({
			displayName: 'Priority ID',
			description: 'The priority ID. Find it with Get Priorities.',
			required: false,
		}),
		labels: Property.Array({
			displayName: 'Labels',
			description: 'Labels that replace the current labels. Labels cannot contain spaces.',
			required: false,
		}),
		parentKey: Property.ShortText({
			displayName: 'Parent Issue Key',
			description: 'Key of the new parent issue or epic.',
			required: false,
		}),
		dueDate: Property.ShortText({
			displayName: 'Due Date',
			description: 'Due date in YYYY-MM-DD format.',
			required: false,
		}),
		issueTypeId: Property.ShortText({
			displayName: 'Issue Type ID',
			description: 'New issue type ID. Find it with Get Issue Types.',
			required: false,
		}),
		fields: Property.Json({
			displayName: 'Additional Fields',
			description:
				'JSON object of other field IDs to values in Jira REST format, e.g. {"customfield_10016": 8}. Set a field to null to clear it. Editable field IDs come from Get Issue Edit Metadata.',
			required: false,
		}),
		notifyUsers: Property.Checkbox({
			displayName: 'Notify Watchers',
			description: 'Send the usual update email to watchers. Turning it off needs admin rights.',
			required: false,
			defaultValue: true,
		}),
	},
	async run({ auth, propsValue }) {
		const labels = jiraAiHelpers.toStringList({ value: propsValue.labels });
		const fields = {
			...jiraAiHelpers.buildIssueFields({
				issueTypeId: propsValue.issueTypeId,
				summary: propsValue.summary,
				description: propsValue.description,
				assigneeAccountId: propsValue.assigneeAccountId,
				priorityId: propsValue.priorityId,
				parentKey: propsValue.parentKey,
				dueDate: propsValue.dueDate,
				extraFields: jiraAiHelpers.toRecord({ value: propsValue.fields, label: 'Additional Fields' }),
			}),
			...(labels.length > 0 ? { labels } : {}),
		};
		if (Object.keys(fields).length === 0) {
			throw new Error('Provide at least one field to update.');
		}
		return jiraApiCall<JiraRecord>({
			auth,
			method: HttpMethod.PUT,
			resourceUri: `/issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}`,
			query: { returnIssue: 'true', notifyUsers: String(propsValue.notifyUsers !== false) },
			body: { fields },
		});
	},
});
