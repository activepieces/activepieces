import { createAction, Property } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { FileAttachment } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const downloadAttachmentAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'downloadAttachment',
	displayName: 'Download Attachment',
	description: 'Download attachments from a specific email message.',
	audience: 'both',
	aiMetadata: { description: 'Fetches all file attachments from a specific Outlook message (by message ID) and writes them to storage for downstream steps. Use this after locating a message to retrieve its attached files. Requires a valid message ID; idempotent since it only reads.', idempotent: true },
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the email message containing the attachment.',
			required: true,
		}),
	},
	async run(context) {
		const { messageId } = context.propsValue;

		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
			baseUrl: getGraphBaseUrl(cloud),
		});

		const response: PageCollection = await client
			.api(`/me/messages/${messageId}/attachments`)
			.get();

		const attachments = [];

		for (const attachment of response.value as FileAttachment[]) {
			if (attachment.name && attachment.contentBytes) {
				attachments.push({
					...attachment,
					file: await context.files.write({
						fileName: attachment.name || 'test.png',
						data: Buffer.from(attachment.contentBytes, 'base64'),
					}),
				});
			}
		}


		return attachments;
	},
});
