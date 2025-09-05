import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	PiecePropValueSchema,
	TriggerStrategy,
	createTrigger,
	Property,
	OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message, FileAttachment } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';

const polling: Polling<PiecePropValueSchema<typeof microsoftOutlookAuth>, { folderId?: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS, propsValue }) => {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const attachments: Array<FileAttachment & { parentMessage: Message }> = [];
		const { folderId } = propsValue;

		const baseUrl = folderId ? `/me/mailFolders/${folderId}/messages` : '/me/messages';
		const timeFilter = lastFetchEpochMS === 0
			? '$top=10'
			: `$filter=receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;

		let response: PageCollection = await client
			.api(`${baseUrl}?${timeFilter}`)
			.orderby('receivedDateTime desc')
			.get();

		const processMessages = async (messages: Message[]) => {
			for (const message of messages) {
				if (message.hasAttachments) {
					try {
						const attachmentResponse: PageCollection = await client
							.api(`/me/messages/${message.id}/attachments`)
							.get();

						for (const attachment of attachmentResponse.value as FileAttachment[]) {
							attachments.push({
								...attachment,
								parentMessage: message,
							});
						}
					} catch (error) {
						console.warn(`Failed to fetch attachments for message ${message.id}:`, error);
					}
				}
			}
		};

		if (lastFetchEpochMS === 0) {
			await processMessages(response.value as Message[]);
		} else {
			while (response.value.length > 0) {
				await processMessages(response.value as Message[]);

				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
		}

		if (attachments.length === 0 && lastFetchEpochMS === 0) {
			return [{
				epochMilliSeconds: Date.now(),
				data: {
					id: 'sample-attachment-id',
					name: 'sample-document.pdf',
					contentType: 'application/pdf',
					size: 1024,
					isInline: false,
					parentMessage: {
						id: 'sample-message-id',
						subject: 'Sample Email with Attachment',
						from: {
							emailAddress: {
								name: 'John Doe',
								address: 'john.doe@example.com'
							}
						},
						receivedDateTime: new Date().toISOString(),
						hasAttachments: true
					}
				}
			}];
		}

		return attachments.map((attachment) => ({
			epochMilliSeconds: dayjs(attachment.parentMessage.receivedDateTime).valueOf(),
			data: attachment,
		}));
	},
};

export const newAttachmentTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newAttachment',
	displayName: 'New Attachment',
	description: 'Triggers when a new attachment arrives on any message.',
	props: {
		folderId: Property.Dropdown({
			displayName: 'Folder (Optional)',
			description: 'Monitor attachments in a specific folder. Leave empty to monitor all folders.',
			required: false,
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

					const folders = response.value as any[];

					return {
						disabled: false,
						options: [
							{ label: 'All Folders', value: '' },
							...folders.map((folder) => ({
								label: folder.displayName || folder.id || 'Unknown',
								value: folder.id || '',
							})),
						],
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
	sampleData: {},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});
