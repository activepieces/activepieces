import { FilesService, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message, FileAttachment } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';
import { mailFolderIdDropdown } from '../common/props';
import { isNil } from '@activepieces/shared';

async function enrichAttachments(
	client: Client,
	messages: Message[],
	files: FilesService,
): Promise<Record<string, any>[]> {
	const attachments: Record<string, any>[] = [];

	for (const message of messages) {
		const attachmentResponse: PageCollection = await client
			.api(`/me/messages/${message.id}/attachments`)
			.get();

		for (const attachment of attachmentResponse.value as FileAttachment[]) {
			const { contentBytes, ...rest } = attachment;

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
			}
		}
	}
	return attachments;
}

export const newAttachmentTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newAttachment',
	displayName: 'New Attachment',
	description: 'Triggers when a new email containing one or more attachments arrives.',
	props: {
		folderId: mailFolderIdDropdown({
			displayName: 'Folder',
			description: 'Monitor attachments in a specific folder. Leave empty to monitor all folders.',
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
		const { folderId } = context.propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});
		const baseUrl = folderId ? `/me/mailFolders/${folderId}/messages` : '/me/messages';

		const response: PageCollection = await client
			.api(`${baseUrl}?$filter=hasAttachments eq true`)
			.top(10)
			.get();

		const attachments = await enrichAttachments(client, response.value as Message[], context.files);

		const items = attachments.map((attachment) => ({
			epochMilliSeconds: dayjs(attachment['messageReceivedDateTime']).valueOf(),
			data: attachment,
		}));

		return items.map((item) => item.data);
	},
	async run(context) {
		const lastFetchEpochMS = await context.store.get<number>('lastPoll');
		if (isNil(lastFetchEpochMS)) {
			throw new Error("lastPoll doesn't exist in the store.");
		}

		const { folderId } = context.propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const baseUrl = folderId ? `/me/mailFolders/${folderId}/messages` : '/me/messages';
		let response: PageCollection = await client
			.api(
				`${baseUrl}?$filter=receivedDateTime gt ${dayjs(
					lastFetchEpochMS,
				).toISOString()} and hasAttachments eq true`,
			)
			.orderby('receivedDateTime desc')
			.get();

		const messages: Message[] = [];

		while (response.value.length > 0) {
			messages.push(...(response.value as Message[]));

			if (response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}
		const attachments = await enrichAttachments(client, messages, context.files);

		const items = attachments.map((attachment) => ({
			epochMilliSeconds: dayjs(attachment['messageReceivedDateTime']).valueOf(),
			data: attachment,
		}));

		const newLastEpochMilliSeconds = items.reduce(
			(acc, item) => Math.max(acc, item.epochMilliSeconds),
			lastFetchEpochMS,
		);
		await context.store.put('lastPoll', newLastEpochMilliSeconds);
		return items.filter((f) => f.epochMilliSeconds > lastFetchEpochMS).map((item) => item.data);
	},
});
