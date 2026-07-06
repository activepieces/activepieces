import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, folderId, messageId } from '../common/props';

export const unarchiveEmailAction = createAction({
	auth: zohoMailAuth,
	name: 'unarchive_email',
	displayName: 'Unarchive Email',
	description: 'Unarchives an email.',
	audience: 'both',
	aiMetadata: {
		description:
			'Restores one previously archived Zoho Mail message back to the active folder view, identified by account ID and message ID. Use to reverse an archive. Idempotent: re-running on a non-archived message has no further effect.',
		idempotent: true,
	},
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		folderId: folderId({ displayName: 'Folder', required: true }),
		messageId: messageId({
			displayName: 'Message ID',
			description: 'The ID of the email message to unarchive.',
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
				mode: 'unArchiveMails',
				messageId: [messageId],
			},
		});

		return response;
	},
});
