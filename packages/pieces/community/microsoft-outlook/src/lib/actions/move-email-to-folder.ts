import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { MailFolder } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const moveEmailToFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'moveEmailToFolder',
	displayName: 'Move Email to Folder',
	description: 'Moves an email message to a different folder.',
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the email message to move.',
			required: true,
		}),
		destinationFolderId: Property.Dropdown({
			displayName: 'Destination Folder',
			description: 'The folder to move the email to.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
					};
				}

				const client = Client.initWithMiddleware({
					authProvider: {
						getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token),
					},
				});

				try {
					const response: PageCollection = await client
						.api('/me/mailFolders')
						.get();

					const folders = response.value as MailFolder[];

					return {
						disabled: false,
						options: folders.map((folder) => ({
							label: folder.displayName || folder.id || 'Unknown',
							value: folder.id || '',
						})),
					};
				} catch (error) {
					return {
						disabled: true,
						options: [],
					};
				}
			},
		}),
	},
	async run(context) {
		const { messageId, destinationFolderId } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const response = await client
			.api(`/me/messages/${messageId}/move`)
			.post({
				destinationId: destinationFolderId,
			});

		return {
			success: true,
			message: 'Email moved successfully.',
			messageId: response.id,
			folderId: response.parentFolderId,
			...response,
		};
	},
});
