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
					placeholder: 'Please connect your Outlook account first.',
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
						label: `${message.subject || 'No Subject'} - ${message.from?.emailAddress?.name || message.from?.emailAddress?.address || 'Unknown Sender'}`,
						value: message.id,
					})),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Could not load emails. Check your connection.',
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
					placeholder: 'Please connect your Outlook account first.',
					disabled: true,
					options: [],
				};
			}

			const authValue = auth as OAuth2PropertyValue;
			const client = outlookCommon.createClient(authValue);

			try {
				const response: PageCollection = await client
					.api(`${outlookCommon.mailboxPrefix(authValue)}/mailFolders/drafts/messages?$top=50&$select=id,subject,from,toRecipients,receivedDateTime`)
					.orderby('receivedDateTime desc')
					.get();

				const messages = response.value as Message[];

				return {
					disabled: false,
					options: messages.map((message) => ({
						label: draftLabel(message),
						value: message.id,
					})),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Could not load drafts. Check your connection.',
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
					placeholder: 'Please connect your Outlook account first.',
					disabled: true,
					options: [],
				};
			}

			const authValue = auth as OAuth2PropertyValue;
			const client = outlookCommon.createClient(authValue);

			try {
				const folders: MailFolder[] = [];
				let response: PageCollection = await client
					.api(`${outlookCommon.mailboxPrefix(authValue)}/mailFolders?$top=100`)
					.get();

				while (response.value.length > 0) {
					folders.push(...response.value);

					if (response['@odata.nextLink']) {
						response = await client.api(response['@odata.nextLink']).get();
					} else {
						break;
					}
				}

				return {
					disabled: false,
					options: folders.map((folder) => ({
						label: folder.displayName || 'Unnamed folder',
						value: folder.id || '',
					})),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Could not load folders. Check your connection.',
				};
			}
		},
	});

function draftLabel(message: Message): string {
	const subject = message.subject || 'No Subject';
	const firstRecipient = message.toRecipients?.[0]?.emailAddress?.address;
	return firstRecipient ? `${subject} - to ${firstRecipient}` : subject;
}
