import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { jiraCloudAuth } from '../../../auth';
import { sendJiraRequest } from '../../common';
import { JiraRecord, jiraAiHelpers } from '../../common/ai-helpers';
import { jiraAiProps } from '../../common/ai-props';

import { uploadAttachmentOutputSchema } from '../../output-schemas';
export const uploadAttachmentAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'upload_attachment',
	classification: 'WRITE',
	displayName: 'Upload Attachment',
	description: 'Attaches a file to an issue.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Upload a file and attach it to an issue, returning the new attachment ID, name, size and content URL. Attachments must be enabled and the file within the site size limit. Not idempotent: each call adds another copy of the file.',
		idempotent: false,
	},
	outputSchema: uploadAttachmentOutputSchema,
	props: {
		issueIdOrKey: jiraAiProps.issueIdOrKey(),
		file: Property.File({
			displayName: 'File',
			required: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'Name to give the attachment, including extension. Defaults to the original file name.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const formData = new FormData();
		const fileName = jiraAiHelpers.isProvided(propsValue.fileName) ? propsValue.fileName.trim() : propsValue.file.filename;
		formData.append('file', Buffer.from(propsValue.file.base64, 'base64'), fileName);
		const response = await sendJiraRequest({
			auth,
			method: HttpMethod.POST,
			url: `issue/${encodeURIComponent(propsValue.issueIdOrKey.trim())}/attachments`,
			headers: { 'X-Atlassian-Token': 'no-check', ...formData.getHeaders() },
			body: formData,
		});
		const attachments: JiraRecord[] = response.body;
		return jiraAiHelpers.toList({ items: attachments });
	},
});
