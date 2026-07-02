import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { mailFolderIdDropdown, messageIdDropdown } from '../common/props';

export const moveEmailToFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'moveEmailToFolder',
	displayName: 'Move Email to Folder',
	description: 'Moves an email message to a specific folder.',
	audience: 'both',
	aiMetadata: { description: 'Moves a specific Outlook message into a chosen mail folder. Use this to organize, archive, or route an email after processing it. Note: the move assigns a new message ID, so re-running with the original ID will fail once moved.', idempotent: false },
	props: {
		messageId: messageIdDropdown({
			displayName: 'Email',
			description: 'Select the email message to move.',
			required: true,
		}),
		destinationFolderId: mailFolderIdDropdown({
			displayName: 'Destination Folder',
			description: 'The folder to move the email to.',
			required: true,
		}),
	},
	async run(context) {
		const { messageId, destinationFolderId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);

		const response = await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/messages/${messageId}/move`).post({
			destinationId: destinationFolderId,
		});

		return response;
	},
});
