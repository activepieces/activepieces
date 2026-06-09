import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, folderId, messageId } from '../common/props';

export const markEmailAsReadAction = createAction({
	auth: zohoMailAuth,
	name: 'mark_email_as_read',
	displayName: 'Mark Email as Read',
	description: 'Marks an email as read.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sets the read flag on one Zoho Mail message identified by account ID and message ID. Use to clear an unread indicator after processing a message. Idempotent: re-running on an already-read message leaves it read.',
		idempotent: true,
	},
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		folderId: folderId({ displayName: 'Folder', required: true }),
		messageId: messageId({
			displayName: 'Message ID',
			description: 'The ID of the email message to mark as read.',
			required: true,
		}),
	},
	async run(context) {
		const { accountId, messageId } = context.propsValue;

		const response = await zohoMailApiCall({
			auth: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/accounts/${accountId}/updatemessage`,
			body: {
				mode: 'markAsRead',
				messageId: [messageId],
			},
		});

		return response;
	},
});
