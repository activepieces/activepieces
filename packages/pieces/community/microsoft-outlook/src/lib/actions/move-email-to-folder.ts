import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { mailFolderIdDropdown, messageIdDropdown } from '../common/props';

export const moveEmailToFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'moveEmailToFolder',
	displayName: 'Move Email to Folder',
	description: 'Moves an email message to a specific folder.',
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

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const response = await client.api(`/me/messages/${messageId}/move`).post({
			destinationId: destinationFolderId,
		});

		return response;
	},
});
