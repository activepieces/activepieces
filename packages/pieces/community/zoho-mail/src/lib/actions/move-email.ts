import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, folderId, messageId } from '../common/props';

export const moveEmailAction = createAction({
	auth: zohoMailAuth,
	name: 'move_email',
	displayName: 'Move Email to Folder',
	description: 'Moves an email to a different folder.',
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		folderId: folderId({ displayName: 'Current Folder', required: true }),
		messageId: messageId({
			displayName: 'Message ID',
			description: 'The ID of the email message to move.',
			required: true,
		}),
		destfolderId: folderId({
			displayName: 'Destination Folder',
			description: 'Select the folder to move the email to.',
			required: true,
		}),
	},
	async run(context) {
		const { accountId, destfolderId, messageId, folderId } = context.propsValue;

		const response = await zohoMailApiCall({
			auth: context.auth,
			method: HttpMethod.PUT,
			resourceUri: `/accounts/${accountId}/updatemessage`,

			body: {
				mode: 'moveMessage',
				destfolderId: destfolderId,
				messageId: [messageId],
				isFolderSpecific: true,
				folderId: folderId,
			},
		});

		return response;
	},
});
