import { OAuth2PropertyValue, Property, tryCatch } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { MailFolder, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from './auth';
import { outlookAtomicCommon } from './atomic-common';
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

			const prefix = outlookCommon.mailboxPrefix(authValue);
			const { folders, failed } = await fetchAllFolders({
				client,
				firstPageUrl: `${prefix}/mailFolders?$top=100&$select=${FOLDER_SELECT}`,
			});

			if (failed && folders.length === 0) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Could not load folders. Check your connection.',
				};
			}

			const tree = await folderTreeOptions({
				client,
				prefix,
				folders,
				parentPath: '',
				limit: MAX_FOLDERS,
				requestLimit: MAX_CHILD_FOLDER_REQUESTS,
			});
			return {
				disabled: false,
				options: tree.options,
				placeholder: failed || tree.incomplete ? 'Not all folders could be loaded.' : undefined,
			};
		},
	});

async function folderTreeOptions({
	client,
	prefix,
	folders,
	parentPath,
	limit,
	requestLimit,
}: {
	client: Client;
	prefix: string;
	folders: MailFolder[];
	parentPath: string;
	limit: number;
	requestLimit: number;
}): Promise<FolderTree> {
	const options: FolderOption[] = [];
	let requests = 0;
	let incomplete = false;
	for (const [index, folder] of folders.entries()) {
		if (options.length >= limit) {
			return { options, requests, incomplete: true };
		}
		const label = `${parentPath}${folder.displayName || 'Unnamed folder'}`;
		options.push({ label, value: folder.id || '' });
		if (!folder.id || !folder.childFolderCount) {
			continue;
		}
		const subtreeLimit = limit - options.length - (folders.length - index - 1);
		if (requests >= requestLimit || subtreeLimit <= 0) {
			incomplete = true;
			continue;
		}
		requests++;
		const children = await fetchAllFolders({
			client,
			firstPageUrl: `${prefix}/mailFolders/${outlookAtomicCommon.encodeGraphId(folder.id)}/childFolders?$top=100&$select=${FOLDER_SELECT}`,
		});
		const subtree = await folderTreeOptions({
			client,
			prefix,
			folders: children.folders,
			parentPath: `${label} / `,
			limit: subtreeLimit,
			requestLimit: requestLimit - requests,
		});
		options.push(...subtree.options);
		requests += subtree.requests;
		incomplete = incomplete || children.failed || subtree.incomplete;
	}
	return { options, requests, incomplete };
}

async function fetchAllFolders({ client, firstPageUrl }: { client: Client; firstPageUrl: string }): Promise<FolderPages> {
	const folders: MailFolder[] = [];
	let nextLink: string | undefined = firstPageUrl;
	while (nextLink) {
		const pageUrl: string = nextLink;
		const page = await tryCatch<PageCollection>(() => client.api(pageUrl).get());
		if (page.error !== null) {
			return { folders, failed: true };
		}
		folders.push(...page.data.value);
		nextLink = page.data['@odata.nextLink'];
	}
	return { folders, failed: false };
}

function draftLabel(message: Message): string {
	const subject = message.subject || 'No Subject';
	const firstRecipient = message.toRecipients?.[0]?.emailAddress?.address;
	return firstRecipient ? `${subject} - to ${firstRecipient}` : subject;
}

const FOLDER_SELECT = 'id,displayName,childFolderCount';
const MAX_FOLDERS = 2000;
const MAX_CHILD_FOLDER_REQUESTS = 100;

type FolderPages = {
	folders: MailFolder[];
	failed: boolean;
};

type FolderTree = {
	options: FolderOption[];
	requests: number;
	incomplete: boolean;
};

type FolderOption = {
	label: string;
	value: string;
};
