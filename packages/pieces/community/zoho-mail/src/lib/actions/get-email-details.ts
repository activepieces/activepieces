import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertAttachment, parseStream, zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, folderId, messageId } from '../common/props';

export const getEmailDetailsAction = createAction({
	auth: zohoMailAuth,
	name: 'get_email_details',
	displayName: 'Get Email Details',
	description: 'Retrieves full content and metadata of a specific email.',
	audience: 'both',
	aiMetadata: {
		description:
			'Fetches the full parsed body, headers, and attachments of one Zoho Mail message, identified by account ID and message ID. Use when you need the actual content of a known email rather than just listing or searching messages. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		folderId: folderId({ displayName: 'Folder', required: true }),
		messageId: messageId({
			displayName: 'Message ID',
			description: 'The ID of the email message to retrieve.',
			required: true,
		}),
	},
	async run(context) {
		const { accountId, messageId } = context.propsValue;

		const response = await zohoMailApiCall<{ data: { content: string; messageId: string } }>({
			auth: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/accounts/${accountId}/messages/${messageId}/originalmessage`,
		});

		const parsedMailResponse = await parseStream(response.data.content);

		return {
			...parsedMailResponse,
			attachments: await convertAttachment(parsedMailResponse.attachments, context.files),
			id: response.data.messageId,
		};
	},
});
