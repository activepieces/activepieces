import { Client, PageCollection, ResponseType } from '@microsoft/microsoft-graph-client';
import { Message, FileAttachment } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

import {
	FilesService,
	TriggerStrategy,
	createTrigger,
	isNil,
	Property,
	Store,
} from '@activepieces/pieces-framework';

import { outlookAtomicCommon } from '../common/atomic-common';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { mailFolderIdDropdown } from '../common/props';
import { newAttachmentTriggerOutputSchema } from '../output-schemas';

const MESSAGE_FIELDS = 'id,subject,from,sender,receivedDateTime,parentFolderId';
const TEST_SAMPLE_SIZE = 5;
const TEST_MAX_MESSAGES = 100;
const POLL_CURSOR_KEY = 'pollCursor';
const LEGACY_LAST_POLL_KEY = 'lastPoll';

export const newAttachmentTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newAttachment',
	classification: 'READ',
	displayName: 'New Attachment',
	description: 'Triggers once for each attachment on a new email.',
	aiMetadata: {
		description:
			'Fires once per attachment when a new email carrying one or more file attachments arrives, optionally scoped to a folder, sender, attachment-name, or file-extension filter. Each fire represents a single attachment from a newly received message.',
	},
	outputSchema: newAttachmentTriggerOutputSchema,
	props: {
		folderId: mailFolderIdDropdown({
			displayName: 'Folder',
			description: 'Leave empty to watch the whole mailbox, including sent mail.',
			required: false,
		}),
		sender: Property.ShortText({
			displayName: 'From',
			description: 'Only emails whose sender address contains this text.',
			placeholder: 'sender@example.com',
			required: false,
		}),
		attachmentNameFilter: Property.ShortText({
			displayName: 'Attachment Name',
			description: 'Only attachments whose file name contains this text.',
			placeholder: 'invoice',
			required: false,
		}),
		fileExtension: Property.ShortText({
			displayName: 'File Extension',
			description:
				'Only attachments with this extension. Separate several with commas, e.g. pdf, docx.',
			placeholder: 'pdf',
			required: false,
		}),
	},
	sampleData: {},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		if (context.isRepublish && (await hasPollCursor(context.store))) {
			return;
		}
		await context.store.put<PollCursor>(POLL_CURSOR_KEY, {
			epochMilliSeconds: Date.now(),
			seenMessageIds: [],
		});
	},
	async onDisable(context) {
		// return
	},
	async test(context) {
		const { folderId, ...filters } = context.propsValue;
		const client = outlookCommon.createClient(context.auth);
		const mailboxPrefix = outlookCommon.mailboxPrefix(context.auth);
		const baseUrl = folderId
			? `${mailboxPrefix}/mailFolders/${folderId}/messages`
			: `${mailboxPrefix}/messages`;

		const response: PageCollection = await client
			.api(`${baseUrl}?$filter=receivedDateTime ge 1900-01-01T00:00:00Z and hasAttachments eq true`)
			.select(MESSAGE_FIELDS)
			.orderby('receivedDateTime desc')
			.top(TEST_MAX_MESSAGES)
			.get();

		const attachments = await enrichAttachments({
			client,
			mailboxPrefix,
			messages: response.value,
			files: context.files,
			filters,
			limit: TEST_SAMPLE_SIZE,
		});
		return attachments.reverse();
	},
	async run(context) {
		const cursor = await readPollCursor(context.store);
		const { folderId, ...filters } = context.propsValue;
		const client = outlookCommon.createClient(context.auth);
		const mailboxPrefix = outlookCommon.mailboxPrefix(context.auth);
		const baseUrl = folderId
			? `${mailboxPrefix}/mailFolders/${folderId}/messages`
			: `${mailboxPrefix}/messages`;

		const since = dayjs(cursor.epochMilliSeconds).toISOString();
		const messages = await listMessages({
			client,
			url: `${baseUrl}?$filter=receivedDateTime ge ${since} and hasAttachments eq true`,
		});

		const attachments = await enrichAttachments({
			client,
			mailboxPrefix,
			messages: messages.filter((message) => isUnseenMessage({ message, cursor })),
			files: context.files,
			filters,
		});

		await context.store.put<PollCursor>(POLL_CURSOR_KEY, advanceCursor({ cursor, messages }));
		return attachments;
	},
});

export function messageMatchesSender({
	message,
	sender,
}: {
	message: Message;
	sender?: string;
}): boolean {
	const wanted = sender?.trim().toLowerCase();
	if (!wanted) {
		return true;
	}
	return [message.from?.emailAddress?.address, message.sender?.emailAddress?.address].some(
		(address) => !isNil(address) && address.toLowerCase().includes(wanted),
	);
}

export function attachmentMatchesFilters({
	name,
	filters,
}: {
	name: string | null | undefined;
	filters: AttachmentFilters;
}): boolean {
	const lowerName = name?.toLowerCase();
	const nameFilter = filters.attachmentNameFilter?.trim().toLowerCase();
	if (nameFilter && !lowerName?.includes(nameFilter)) {
		return false;
	}
	const extensions = parseExtensions(filters.fileExtension);
	if (
		extensions.length > 0 &&
		!extensions.some((extension) => lowerName?.endsWith(`.${extension}`))
	) {
		return false;
	}
	return true;
}

function parseExtensions(fileExtension?: string): string[] {
	return (fileExtension ?? '')
		.split(',')
		.map((extension) => extension.trim().toLowerCase().replace(/^\./, ''))
		.filter((extension) => extension.length > 0);
}

function isUnseenMessage({ message, cursor }: { message: Message; cursor: PollCursor }): boolean {
	const messageTime = dayjs(message.receivedDateTime).valueOf();
	if (messageTime !== cursor.epochMilliSeconds) {
		return messageTime > cursor.epochMilliSeconds;
	}
	return !isNil(cursor.seenMessageIds) && !cursor.seenMessageIds.includes(message.id!);
}

function advanceCursor({
	cursor,
	messages,
}: {
	cursor: PollCursor;
	messages: Message[];
}): PollCursor {
	const epochMilliSeconds = messages.reduce(
		(latest, message) => Math.max(latest, dayjs(message.receivedDateTime).valueOf()),
		cursor.epochMilliSeconds,
	);
	const seenAtLatest = messages
		.filter((message) => dayjs(message.receivedDateTime).valueOf() === epochMilliSeconds)
		.map((message) => message.id!);
	const carriedOver =
		epochMilliSeconds === cursor.epochMilliSeconds ? cursor.seenMessageIds ?? [] : [];
	return {
		epochMilliSeconds,
		seenMessageIds: [...new Set([...seenAtLatest, ...carriedOver])],
	};
}

async function hasPollCursor(store: Store): Promise<boolean> {
	const [cursor, legacyLastPoll] = await Promise.all([
		store.get<PollCursor>(POLL_CURSOR_KEY),
		store.get<number>(LEGACY_LAST_POLL_KEY),
	]);
	return !isNil(cursor) || !isNil(legacyLastPoll);
}

async function readPollCursor(store: Store): Promise<PollCursor> {
	const cursor = await store.get<PollCursor>(POLL_CURSOR_KEY);
	if (!isNil(cursor)) {
		return cursor;
	}
	const legacyLastPoll = await store.get<number>(LEGACY_LAST_POLL_KEY);
	if (isNil(legacyLastPoll)) {
		throw new Error("lastPoll doesn't exist in the store.");
	}
	return { epochMilliSeconds: legacyLastPoll, seenMessageIds: null };
}

async function listMessages({ client, url }: { client: Client; url: string }): Promise<Message[]> {
	let response: PageCollection = await client
		.api(url)
		.select(MESSAGE_FIELDS)
		.orderby('receivedDateTime desc')
		.get();

	const messages: Message[] = [];

	while (response.value.length > 0) {
		messages.push(...(response.value as Message[]));
		if (!response['@odata.nextLink']) {
			break;
		}
		response = await client.api(response['@odata.nextLink']).get();
	}
	return messages;
}

async function downloadAttachment({
	client,
	mailboxPrefix,
	messageId,
	attachmentId,
}: {
	client: Client;
	mailboxPrefix: string;
	messageId: string;
	attachmentId: string;
}): Promise<Buffer> {
	const messagePath = `${mailboxPrefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}`;
	const bytes = await client
		.api(`${messagePath}/attachments/${outlookAtomicCommon.encodeGraphId(attachmentId)}/$value`)
		.responseType(ResponseType.ARRAYBUFFER)
		.get();
	return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}

async function enrichAttachments({
	client,
	mailboxPrefix,
	messages,
	files,
	filters,
	limit,
}: {
	client: Client;
	mailboxPrefix: string;
	messages: Message[];
	files: FilesService;
	filters: AttachmentFilters;
	limit?: number;
}): Promise<Record<string, any>[]> {
	const attachments: Record<string, any>[] = [];

	for (const message of messages) {
		if (!messageMatchesSender({ message, sender: filters.sender })) {
			continue;
		}

		const attachmentResponse: PageCollection = await client
			.api(`${mailboxPrefix}/messages/${message.id}/attachments`)
			.get();

		for (const attachment of attachmentResponse.value as (FileAttachment & {
			'@odata.type'?: string;
		})[]) {
			const { contentBytes, ...rest } = attachment;

			if (!attachmentMatchesFilters({ name: attachment.name, filters })) {
				continue;
			}

			if (!attachment.name || attachment['@odata.type'] !== '#microsoft.graph.fileAttachment') {
				continue;
			}

			const data = contentBytes
				? Buffer.from(contentBytes, 'base64')
				: await downloadAttachment({
						client,
						mailboxPrefix,
						messageId: message.id!,
						attachmentId: attachment.id!,
				  });

			const file = await files.write({
				fileName: attachment.name,
				data,
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
	return attachments;
}

type PollCursor = {
	epochMilliSeconds: number;
	seenMessageIds: string[] | null;
};

type AttachmentFilters = {
	sender?: string;
	attachmentNameFilter?: string;
	fileExtension?: string;
};
