import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { MailFolder, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from './auth';
import { outlookCommon } from './client';

type DropdownParams = {
	displayName: string;
	description: string;
	required: boolean;
};

export const messageIdDropdown = (params: DropdownParams) =>
	Property.Dropdown({
		auth: microsoftOutlookAuth,
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

			const authValue = auth as OAuth2PropertyValue;
			const client = outlookCommon.createClient(authValue);

			try {
				const response: PageCollection = await client
					.api(`${outlookCommon.mailboxPrefix(authValue)}/messages?$top=50&$select=id,subject,from,receivedDateTime`)
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
		auth: microsoftOutlookAuth,
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

			const authValue = auth as OAuth2PropertyValue;
			const client = outlookCommon.createClient(authValue);

			try {
				const response: PageCollection = await client
					.api(`${outlookCommon.mailboxPrefix(authValue)}/mailFolders/drafts/messages?$top=50&$select=id,subject,from,receivedDateTime`)
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
		auth: microsoftOutlookAuth,
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

			const authValue = auth as OAuth2PropertyValue;
			const client = outlookCommon.createClient(authValue);

			try {
				const response: PageCollection = await client.api(`${outlookCommon.mailboxPrefix(authValue)}/mailFolders`).get();

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
