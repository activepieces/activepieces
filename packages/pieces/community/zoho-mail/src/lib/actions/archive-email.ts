import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, folderId, messageId } from '../common/props';

export const archiveEmailAction = createAction({
	auth: zohoMailAuth,
	name: 'archive_email',
	displayName: 'Archive Email',
	description: 'Archives an email.',
	audience: 'both',
	aiMetadata: {
		description:
			'Archives one Zoho Mail message identified by account ID and message ID, removing it from the active folder view. Use to clear a message out of the inbox without deleting it. Idempotent: re-archiving an already-archived message has no further effect.',
		idempotent: true,
	},
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		folderId: folderId({ displayName: 'Folder', required: true }),
		messageId: messageId({
			displayName: 'Message ID',
			description: 'The ID of the email message to archive.',
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
				mode: 'archiveMails',
				messageId: [messageId],
			},
		});

		return response;
	},
});
