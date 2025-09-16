import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { PageCollection, Client } from '@microsoft/microsoft-graph-client';
import { MailFolder, Message } from '@microsoft/microsoft-graph-types';

type DropdownParams = {
	displayName: string;
	description: string;
	required: boolean;
};

export const messageIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first.',
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
					.api('/me/messages?$top=50&$select=id,subject,from,receivedDateTime')
					.orderby('receivedDateTime desc')
					.get();

				const messages = response.value as Message[];

				return {
					disabled: false,
					options: messages.map((message) => ({
						label: `${message.subject || 'No Subject'}`,
						value: message.id,
					})),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
				};
			}
		},
	});

export const draftMessageIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first.',
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
					.api('/me/mailFolders/drafts/messages?$top=50&$select=id,subject,from,receivedDateTime')
					.orderby('receivedDateTime desc')
					.get();

				const messages = response.value as Message[];

				return {
					disabled: false,
					options: messages.map((message) => ({
						label: `${message.subject || 'No Subject'}`,
						value: message.id,
					})),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
				};
			}
		},
	});

export const mailFolderIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		required: params.required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first.',
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
				const response: PageCollection = await client.api('/me/mailFolders').get();

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
	});
