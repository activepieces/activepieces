import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { jiraCloudAuth } from '../../../auth';
import { jiraApiCall } from '../../common';

import { downloadAttachmentOutputSchema } from '../../output-schemas';
export const downloadAttachmentAiAction = createAction({
	auth: jiraCloudAuth,
	name: 'download_attachment',
	classification: 'READ',
	displayName: 'Download Attachment',
	description: 'Downloads an attachment file and its metadata.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Download an attachment by attachment ID and return its file together with its name, MIME type, size, author and creation date. Attachment IDs are in the attachment field of Fetch Issue. Read-only.',
		idempotent: true,
	},
	outputSchema: downloadAttachmentOutputSchema,
	props: {
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'The numeric attachment ID, from the attachment field of Fetch Issue.',
			required: true,
		}),
	},
	async run({ auth, propsValue, files }) {
		const attachmentId = propsValue.attachmentId.trim();
		const metadata = await jiraApiCall<AttachmentMetadata>({
			auth,
			method: HttpMethod.GET,
			resourceUri: `/attachment/${encodeURIComponent(attachmentId)}`,
		});
		const content = await httpClient.sendRequest<ArrayBuffer>({
			method: HttpMethod.GET,
			url: `${auth.props.instanceUrl}/rest/api/3/attachment/content/${encodeURIComponent(attachmentId)}`,
			authentication: {
				type: AuthenticationType.BASIC,
				username: auth.props.email,
				password: auth.props.apiToken,
			},
			responseType: 'arraybuffer',
			followRedirects: true,
		});
		const file = await files.write({ fileName: metadata.filename, data: Buffer.from(content.body) });
		return {
			id: metadata.id,
			filename: metadata.filename,
			mime_type: metadata.mimeType ?? null,
			size: metadata.size ?? null,
			created: metadata.created ?? null,
			author_account_id: metadata.author?.accountId ?? null,
			author_display_name: metadata.author?.displayName ?? null,
			file,
		};
	},
});

type AttachmentMetadata = {
	id: string;
	filename: string;
	mimeType?: string;
	size?: number;
	created?: string;
	author?: { accountId?: string; displayName?: string };
};
