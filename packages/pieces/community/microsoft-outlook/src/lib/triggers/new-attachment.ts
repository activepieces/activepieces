import { FilesService, TriggerStrategy, createTrigger,  Property } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message, FileAttachment } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { mailFolderIdDropdown } from '../common/props';
import { isNil } from '@activepieces/pieces-framework';
import { newAttachmentTriggerOutputSchema } from '../output-schemas';

const MESSAGE_FIELDS = 'id,subject,from,sender,receivedDateTime,parentFolderId';
const TEST_SAMPLE_SIZE = 5;
const TEST_MAX_MESSAGES = 100;

type AttachmentFilters = {
	sender?: string;
	attachmentNameFilter?: string;
	fileExtension?: string;
};

export function messageMatchesSender(message: Message, sender?: string): boolean {
	const wanted = sender?.trim().toLowerCase();
	if (!wanted) {
		return true;
	}
	return [message.from?.emailAddress?.address, message.sender?.emailAddress?.address].some(
		(address) => !isNil(address) && address.toLowerCase().includes(wanted),
	);
}

function parseExtensions(fileExtension?: string): string[] {
	return (fileExtension ?? '')
		.split(',')
		.map((extension) => extension.trim().toLowerCase().replace(/^\./, ''))
		.filter((extension) => extension.length > 0);
}

export function attachmentMatchesFilters(name: string | null | undefined, filters: AttachmentFilters): boolean {
	const lowerName = name?.toLowerCase();
	const nameFilter = filters.attachmentNameFilter?.trim().toLowerCase();
	if (nameFilter && !lowerName?.includes(nameFilter)) {
		return false;
	}
	const extensions = parseExtensions(filters.fileExtension);
	if (extensions.length > 0 && !extensions.some((extension) => lowerName?.endsWith(`.${extension}`))) {
		return false;
	}
	return true;
}

async function enrichAttachments(
	client: Client,
	mailboxPrefix: string,
	messages: Message[],
	files: FilesService,
	filters: AttachmentFilters,
	limit?: number,
): Promise<Record<string, any>[]> {
	const attachments: Record<string, any>[] = [];

	for (const message of messages) {
		if (!messageMatchesSender(message, filters.sender)) {
			continue;
		}

		const attachmentResponse: PageCollection = await client
			.api(`${mailboxPrefix}/messages/${message.id}/attachments`)
			.get();

		for (const attachment of attachmentResponse.value as FileAttachment[]) {
			const { contentBytes, ...rest } = attachment;

			if (!attachmentMatchesFilters(attachment.name, filters)) {
				continue;
			}

			if (attachment.name && contentBytes) {
				const file = await files.write({
					fileName: attachment.name,
					data: Buffer.from(contentBytes, 'base64'),
				});

				attachments.push({
					file,
					messageId: message.id!,
					messageSubject: message.subject,
					messageSender: message.sender,
					messageReceivedDateTime: message.receivedDateTime,
					parentFolderId: message.parentFolderId,
					...rest,
				});

				if (!isNil(limit) && attachments.length >= limit) {
					return attachments;
				}
			}
		}
	}
	return attachments;
}

async function listMessages(client: Client, url: string, maxMessages?: number): Promise<Message[]> {
	let response: PageCollection = await client
		.api(url)
		.select(MESSAGE_FIELDS)
		.orderby('receivedDateTime desc')
		.get();

	const messages: Message[] = [];

	while (response.value.length > 0) {
		messages.push(...(response.value as Message[]));

		if (!isNil(maxMessages) && messages.length >= maxMessages) {
			return messages.slice(0, maxMessages);
		}
		if (response['@odata.nextLink']) {
			response = await client.api(response['@odata.nextLink']).get();
		} else {
			break;
		}
	}
	return messages;
}

export const newAttachmentTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newAttachment',
	classification: 'READ',
	displayName: 'New Attachment',
	description: 'Triggers when a new email containing one or more attachments arrives.',
	aiMetadata: {
		description: 'Fires once per attachment when a new email carrying one or more file attachments arrives, optionally scoped to a folder, sender, attachment-name, or file-extension filter. Each fire represents a single attachment from a newly received message.',
	},
	outputSchema: newAttachmentTriggerOutputSchema,
	props: {
		folderId: mailFolderIdDropdown({
			displayName: 'Folder',
			description: 'Monitor attachments in a specific folder. Leave empty to monitor all folders.',
			required: false,
		}),
		sender: Property.ShortText({
			displayName: 'From (Sender Email)',
			description: 'Filter emails from a specific sender (contains). Leave empty to include all senders.',
			required: false,
		}),
		attachmentNameFilter: Property.ShortText({
			displayName: 'Attachment Name Filter',
			description: 'Filter attachments by name (contains). Leave empty to include all attachments.',
			required: false,
		}),
		fileExtension: Property.ShortText({
			displayName: 'File Extension',
			description: 'Only attachments with this extension. Separate several with commas, e.g. pdf, docx.',
			placeholder: 'pdf',
			required: false,
		}),
	},
	sampleData: {},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await context.store.put('lastPoll', Date.now());
	},
	async onDisable(context) {
		// return
	},
	async test(context) {
		const { folderId, ...filters } = context.propsValue;
		const client = outlookCommon.createClient(context.auth);
		const mailboxPrefix = outlookCommon.mailboxPrefix(context.auth);
		const baseUrl = folderId ? `${mailboxPrefix}/mailFolders/${folderId}/messages` : `${mailboxPrefix}/messages`;

		const messages = await listMessages(
			client,
			`${baseUrl}?$filter=hasAttachments eq true`,
			TEST_MAX_MESSAGES,
		);

		return enrichAttachments(client, mailboxPrefix, messages, context.files, filters, TEST_SAMPLE_SIZE);
	},
	async run(context) {
		const lastFetchEpochMS = await context.store.get<number>('lastPoll');
		if (isNil(lastFetchEpochMS)) {
			throw new Error("lastPoll doesn't exist in the store.");
		}

		const { folderId, ...filters } = context.propsValue;
		const client = outlookCommon.createClient(context.auth);
		const mailboxPrefix = outlookCommon.mailboxPrefix(context.auth);

		const baseUrl = folderId ? `${mailboxPrefix}/mailFolders/${folderId}/messages` : `${mailboxPrefix}/messages`;
		const messages = await listMessages(
			client,
			`${baseUrl}?$filter=receivedDateTime gt ${dayjs(
				lastFetchEpochMS,
			).toISOString()} and hasAttachments eq true`,
		);

		const newMessages = messages.filter(
			(message) => dayjs(message.receivedDateTime).valueOf() > lastFetchEpochMS,
		);
		const attachments = await enrichAttachments(client, mailboxPrefix, newMessages, context.files, filters);

		const newLastEpochMilliSeconds = messages.reduce(
			(acc, message) => Math.max(acc, dayjs(message.receivedDateTime).valueOf()),
			lastFetchEpochMS,
		);
		await context.store.put('lastPoll', newLastEpochMilliSeconds);
		return attachments;
	},
});
