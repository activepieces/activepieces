import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';

const polling: Polling<PiecePropValueSchema<typeof microsoftOutlookAuth>, {
	folderId: string;
}> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS, propsValue }) => {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const messages = [];
		const folderId = propsValue.folderId;
		
		const wellKnownFolders = ['inbox', 'sentitems', 'drafts', 'deleteditems', 'junkemail', 'outbox'];
		const normalizedFolderId = wellKnownFolders.includes(folderId.toLowerCase()) 
			? folderId.toLowerCase() 
			: folderId;

		const filter =
			lastFetchEpochMS === 0
				? '$top=10'
				: `$filter=receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;

		try {
			let response: PageCollection = await client
				.api(`/me/mailFolders/${normalizedFolderId}/messages?${filter}`)
				.select('id,subject,receivedDateTime,sentDateTime,createdDateTime,lastModifiedDateTime,from,sender,toRecipients,ccRecipients,bccRecipients,replyTo,hasAttachments,importance,isRead,isDraft,categories,bodyPreview,webLink,parentFolderId,conversationId,conversationIndex,internetMessageId,changeKey,flag,inferenceClassification,isDeliveryReceiptRequested,isReadReceiptRequested')
				.orderby('receivedDateTime desc')
				.get();

			if (lastFetchEpochMS === 0) {
				for (const message of response.value as Message[]) {
					messages.push(message);
				}
			} else {
				while (response.value.length > 0) {
					for (const message of response.value as Message[]) {
						messages.push(message);
					}

					if (response['@odata.nextLink']) {
						response = await client.api(response['@odata.nextLink']).get();
					} else {
						break;
					}
				}
			}

			return messages.map((message) => ({
				epochMilliSeconds: dayjs(message.receivedDateTime).valueOf(),
				data: message,
			}));
		} catch (error: any) {
			console.error('New Email in Folder Trigger Error:', error);
			
			if (error.status === 404) {
				throw new Error(`Folder '${folderId}' not found. Please verify the folder ID or use a valid folder name.`);
			} else if (error.status === 403) {
				throw new Error('Access denied. Please ensure you have permission to read emails from this folder.');
			} else if (error.status === 401) {
				throw new Error('Authentication failed. Please check your Microsoft Outlook connection.');
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to fetch emails from folder: ${errorMessage}`);
		}
	},
};

export const newEmailInFolderTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newEmailInFolder',
	displayName: 'New Email in Folder',
	description: 'Triggers when a new email is received in a specified folder in Microsoft Outlook.',
	props: {
		folderId: Property.ShortText({
			displayName: 'Folder ID',
			description: 'The ID or name of the folder to monitor. Use well-known names: "inbox", "sentitems", "drafts", "deleteditems", "junkemail", "outbox" or provide a specific folder ID.',
			required: true,
			defaultValue: 'inbox',
		}),
	},
	sampleData: {
		id: 'sample-message-id',
		subject: 'Sample Email in Folder',
		receivedDateTime: '2023-01-01T10:00:00Z',
		sentDateTime: '2023-01-01T10:00:00Z',
		createdDateTime: '2023-01-01T09:45:00Z',
		lastModifiedDateTime: '2023-01-01T10:00:00Z',
		hasAttachments: false,
		importance: 'normal',
		isRead: false,
		isDraft: false,
		categories: ['Important'],
		bodyPreview: 'This is a sample email received in the specified folder...',
		parentFolderId: 'AAMkADhAAAAAAEPAAA=',
		conversationId: 'AAQkADhNCuP8OKSm-0NE=',
		conversationIndex: 'Adfsdfsdfsdfw==',
		internetMessageId: '<sample-message@example.com>',
		changeKey: 'CQAAABYAAAC4ofQHEIqCSbQPot83AFcbAAAnjjuE',
		inferenceClassification: 'focused',
		isDeliveryReceiptRequested: false,
		isReadReceiptRequested: false,
		from: {
			emailAddress: {
				name: 'John Doe',
				address: 'john.doe@example.com',
			},
		},
		sender: {
			emailAddress: {
				name: 'John Doe',
				address: 'john.doe@example.com',
			},
		},
		toRecipients: [
			{
				emailAddress: {
					name: 'Jane Smith',
					address: 'jane.smith@example.com',
				},
			},
		],
		ccRecipients: [
			{
				emailAddress: {
					name: 'Bob Wilson',
					address: 'bob.wilson@example.com',
				},
			},
		],
		bccRecipients: [],
		replyTo: [],
		flag: {
			flagStatus: 'notFlagged',
		},
		webLink: 'https://outlook.office.com/owa/?ItemID=sample-message-id',
	},
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
