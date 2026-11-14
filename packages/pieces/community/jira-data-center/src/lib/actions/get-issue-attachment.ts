import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraDataCenterAuth } from '../../auth';
import { jiraApiCall, jiraToken } from '../common';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getIssueAttachmentAction = createAction({
	auth: jiraDataCenterAuth,
	name: 'get-issue-attachment',
	classification: 'READ',
	displayName: 'Get Issue Attachment',
	description: "Gets an attachment's details and downloads its file.",
	audience: 'both',
	aiMetadata: {
		description:
			'Downloads a single attachment from Jira Data Center/Server by its attachment ID, returning the attachment metadata and the file contents. Use when an agent already has an attachment ID (e.g. from reading an issue) and needs the actual file. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: "Found in a Get Issue step's output, under fields → attachment.",
			placeholder: '10001',
			required: true,
		}),
	},
	async run(context) {
		const { attachmentId } = context.propsValue;

		const attachmentResponse = await jiraApiCall<{ filename: string; content: string }>({
			method: HttpMethod.GET,
			resourceUri: `/attachment/${attachmentId}`,
			auth: context.auth,
		});

		const { filename, content } = attachmentResponse;

		const response = await httpClient.sendRequest({
			url: content,
			method: HttpMethod.GET,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: jiraToken(context.auth),
			},
			responseType: 'arraybuffer',
			followRedirects: true,
		});

		return {
			...attachmentResponse,
			file: await context.files.write({
				fileName: filename,
				data: Buffer.from(response.body),
			}),
		};
	},
});
