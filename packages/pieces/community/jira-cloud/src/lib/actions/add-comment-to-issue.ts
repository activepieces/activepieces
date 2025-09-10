import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

export const addCommentToIssueAction = createAction({
	auth: jiraCloudAuth,
	name: 'add_issue_comment',
	displayName: 'Add Issue Comment',
	description: 'Adds a comment to an issue.',
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		comment: Property.LongText({
			displayName: 'Comment Body',
			required: true,
		}),
		isADF: Property.Checkbox({
      displayName: 'Comment is in JSON Atlassian Document Format',
			description: 'https://developer.atlassian.com/cloud/jira/platform/apis/document/structure',
      required: false,
      defaultValue: false,
    }),
	},
	async run(context) {
		const { issueId, comment, isADF } = context.propsValue;

		let commentBody = {}

		if (isADF) {
			commentBody = JSON.parse(comment);
		} else {
			commentBody = {
				version: 1,
				type: 'doc',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'text',
								text: comment,
							},
						],
					},
				],
			};
		}

		const response = await sendJiraRequest({
			method: HttpMethod.POST,
			url: `issue/${issueId}/comment`,
			auth: context.auth,
			body: {
				body: commentBody,
			},
		});
		return response.body;
	},
});
