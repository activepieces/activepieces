import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, folderId, messageId } from '../common/props';

export const markEmailAsUnreadAction = createAction({
	auth: zohoMailAuth,
	name: 'mark_email_as_unread',
	classification: 'WRITE',
	displayName: 'Mark Email as Unread',
	description: 'Marks an email as unread.',
	audience: 'both',
	aiMetadata: {
		description:
			'Clears the read flag on one Zoho Mail message identified by account ID and message ID, returning it to unread state. Use to re-surface a message for later attention. Idempotent: re-running on an already-unread message leaves it unread.',
		idempotent: true,
	},
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		folderId: folderId({ displayName: 'Folder', required: true }),
		messageId: messageId({
			displayName: 'Email',
			description: 'Pick from the 50 newest in the folder, or map a message ID.',
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
				mode: 'markAsUnread',
				messageId: [messageId],
			},
		});

		return response;
	},
});
