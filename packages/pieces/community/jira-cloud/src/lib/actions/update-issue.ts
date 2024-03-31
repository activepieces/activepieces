import { Property, createAction } from '@activepieces/pieces-framework';
import { JiraAuth, jiraCloudAuth } from '../../auth';
import {
	getIssueIdDropdown,
	getIssueTypeIdDropdown,
	getProjectIdDropdown,
	getUsersDropdown,
} from '../common/props';
import { getPriorities, updateJiraIssue } from '../common';

export const updateIssueAction = createAction({
	name: 'update_issue',
	displayName: 'Update Issue',
	description: 'Updates a existing issue in a project.',
	auth: jiraCloudAuth,
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		issueTypeId: getIssueTypeIdDropdown({ refreshers: ['projectId'], required: false }),
		summary: Property.ShortText({
			displayName: 'Summary',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
		assignee: getUsersDropdown({
			displayName: 'Assignee',
			refreshers: ['projectId'],
			required: false,
		}),
		priority: Property.Dropdown({
			displayName: 'Priority',
			required: false,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						options: [],
					};
				}

				const priorities = await getPriorities({ auth: auth as JiraAuth });
				return {
					options: priorities.map((item) => {
						return {
							label: item.name,
							value: item.id,
						};
					}),
				};
			},
		}),
		parentKey: Property.ShortText({
			displayName: 'Parent Key',
			description: 'If this issue is a subtask, insert the parent issue key',
			required: false,
		}),
	},
	run: async ({ auth, propsValue }) => {
		const { issueId, issueTypeId, assignee, summary, description, priority, parentKey } =
			propsValue;

		return await updateJiraIssue({
			auth,
			issueId,
			summary,
			issueTypeId,
			assignee,
			description,
			priority,
			parentKey,
		});
	},
});
