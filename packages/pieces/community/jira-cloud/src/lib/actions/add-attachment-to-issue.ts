import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import FormData from 'form-data';
import { getProjectIdDropdown, getIssueIdDropdown } from '../common/props';

export const addAttachmentToIssueAction = createAction({
	auth: jiraCloudAuth,
	name: 'add_issue_attachment',
	displayName: 'Add Attachment to Issue',
	description: 'Adds an attachment to an issue.',
	props: {
		projectId: getProjectIdDropdown(),
		issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
		attachment: Property.File({
			displayName: 'Attachment',
			required: true,
		}),
	},
	async run(context) {
		const { issueId, attachment } = context.propsValue;
		const formData = new FormData();
		const fileBuffer = Buffer.from(attachment.base64, 'base64');
		formData.append('file', fileBuffer, attachment.filename);

		const response = await sendJiraRequest({
			method: HttpMethod.POST,
			url: `issue/${issueId}/attachments`,
			auth: context.auth,
			headers: {
				'X-Atlassian-Token': 'no-check',
				...formData.getHeaders(),
			},
			body: formData,
		});
		return response.body;
	},
});
