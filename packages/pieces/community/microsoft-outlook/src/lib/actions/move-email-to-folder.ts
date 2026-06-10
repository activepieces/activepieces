import { createAction, Property } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
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

		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
			baseUrl: getGraphBaseUrl(cloud),
		});

		const response = await client.api(`/me/messages/${messageId}/move`).post({
			destinationId: destinationFolderId,
		});

		return response;
	},
});
