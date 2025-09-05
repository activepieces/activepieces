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
	searchQuery?: string;
	fromEmail?: string;
	toEmail?: string;
	ccEmail?: string;
	bccEmail?: string;
	subjectContains?: string;
	bodyContains?: string;
	hasAttachments?: boolean;
	isRead?: boolean;
	isDraft?: boolean;
	categories?: string;
	dateFrom?: string;
	dateTo?: string;
	maxResults?: number;
}> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS, propsValue }) => {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const messages = [];

		// Build filter conditions based on props
		const filters = [];
		
		if (propsValue.fromEmail) {
			filters.push(`from/emailAddress/address eq '${propsValue.fromEmail}'`);
		}
		
		if (propsValue.toEmail) {
			filters.push(`toRecipients/any(r:r/emailAddress/address eq '${propsValue.toEmail}')`);
		}
		
		if (propsValue.ccEmail) {
			filters.push(`ccRecipients/any(r:r/emailAddress/address eq '${propsValue.ccEmail}')`);
		}
		
		if (propsValue.bccEmail) {
			filters.push(`bccRecipients/any(r:r/emailAddress/address eq '${propsValue.bccEmail}')`);
		}
		
		if (propsValue.subjectContains) {
			filters.push(`contains(subject,'${propsValue.subjectContains}')`);
		}
		
		if (propsValue.bodyContains) {
			filters.push(`contains(bodyPreview,'${propsValue.bodyContains}')`);
		}
		
		if (propsValue.hasAttachments !== undefined) {
			filters.push(`hasAttachments eq ${propsValue.hasAttachments}`);
		}
		
		if (propsValue.isRead !== undefined) {
			filters.push(`isRead eq ${propsValue.isRead}`);
		}
		
		if (propsValue.isDraft !== undefined) {
			filters.push(`isDraft eq ${propsValue.isDraft}`);
		}
		
		if (propsValue.categories) {
			filters.push(`categories/any(c:c eq '${propsValue.categories}')`);
		}
		
		if (propsValue.dateFrom) {
			filters.push(`receivedDateTime ge ${dayjs(propsValue.dateFrom).toISOString()}`);
		}
		
		if (propsValue.dateTo) {
			filters.push(`receivedDateTime le ${dayjs(propsValue.dateTo).toISOString()}`);
		}

		// Add time filter for polling
		if (lastFetchEpochMS > 0) {
			filters.push(`receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`);
		}

		const filterQuery = filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';
		const topQuery = lastFetchEpochMS === 0 ? `$top=${propsValue.maxResults || 10}` : '';
		const searchQuery = propsValue.searchQuery ? `$search="${propsValue.searchQuery}"` : '';

		// Combine query parameters
		const queryParams = [filterQuery, topQuery, searchQuery].filter(Boolean).join('&');
		const finalQuery = queryParams ? `?${queryParams}` : '';

		try {
			let response: PageCollection = await client
				.api(`/me/mailFolders/inbox/messages${finalQuery}`)
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
			console.error('New Matched Email Trigger Error:', error);
			
			if (error.status === 404) {
				throw new Error('Inbox folder not found. Please verify your Microsoft Outlook connection.');
			} else if (error.status === 403) {
				throw new Error('Access denied. Please ensure you have permission to read emails from the inbox.');
			} else if (error.status === 401) {
				throw new Error('Authentication failed. Please check your Microsoft Outlook connection.');
			} else if (error.status === 400) {
				throw new Error('Invalid search criteria. Please check your filter parameters.');
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to search for matched emails: ${errorMessage}`);
		}
	},
};

export const newMatchedEmailTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newMatchedEmail',
	displayName: 'New Matched Email',
	description: 'Triggers when a new email matching specified criteria is received in the inbox.',
	props: {
		searchQuery: Property.LongText({
			displayName: 'Search Query',
			description: 'Search query to match emails. You can use keywords, phrases, etc. This uses Microsoft Graph search capabilities.',
			required: false,
		}),
		fromEmail: Property.ShortText({
			displayName: 'From Email',
			description: 'Match emails from a specific sender email address.',
			required: false,
		}),
		toEmail: Property.ShortText({
			displayName: 'To Email',
			description: 'Match emails sent to a specific recipient email address.',
			required: false,
		}),
		ccEmail: Property.ShortText({
			displayName: 'CC Email',
			description: 'Match emails with a specific email address in CC.',
			required: false,
		}),
		bccEmail: Property.ShortText({
			displayName: 'BCC Email',
			description: 'Match emails with a specific email address in BCC.',
			required: false,
		}),
		subjectContains: Property.ShortText({
			displayName: 'Subject Contains',
			description: 'Match emails with subject containing this text.',
			required: false,
		}),
		bodyContains: Property.ShortText({
			displayName: 'Body Contains',
			description: 'Match emails with body preview containing this text.',
			required: false,
		}),
		hasAttachments: Property.Checkbox({
			displayName: 'Has Attachments',
			description: 'Filter emails based on whether they have attachments or not.',
			required: false,
		}),
		isRead: Property.Checkbox({
			displayName: 'Is Read',
			description: 'Filter emails based on read status.',
			required: false,
		}),
		isDraft: Property.Checkbox({
			displayName: 'Is Draft',
			description: 'Filter emails based on draft status.',
			required: false,
		}),
		categories: Property.ShortText({
			displayName: 'Category',
			description: 'Match emails with a specific category/label.',
			required: false,
		}),
		dateFrom: Property.DateTime({
			displayName: 'Date From',
			description: 'Match emails received from this date onwards.',
			required: false,
		}),
		dateTo: Property.DateTime({
			displayName: 'Date To',
			description: 'Match emails received up to this date.',
			required: false,
		}),
		maxResults: Property.Number({
			displayName: 'Max Results',
			description: 'Maximum number of emails to return in the initial fetch (1-50). Default is 10.',
			required: false,
			defaultValue: 10,
		}),
	},
	sampleData: {
		id: 'sample-message-id',
		subject: 'Sample Matched Email',
		receivedDateTime: '2023-01-01T10:00:00Z',
		sentDateTime: '2023-01-01T10:00:00Z',
		createdDateTime: '2023-01-01T09:45:00Z',
		lastModifiedDateTime: '2023-01-01T10:00:00Z',
		hasAttachments: false,
		importance: 'normal',
		isRead: false,
		isDraft: false,
		categories: ['Important'],
		bodyPreview: 'This is a sample matched email based on your criteria...',
		parentFolderId: 'AAMkADhAAAAAAEPAAA=',
		conversationId: 'AAQkADhNCuP8OKSm-0NE=',
		conversationIndex: 'Adfsdfsdfsdfw==',
		internetMessageId: '<sample-matched@example.com>',
		changeKey: 'CQAAABYAAAC4ofQHEIqCSbQPot83AFcbAAAnjjuE',
		inferenceClassification: 'focused',
		isDeliveryReceiptRequested: false,
		isReadReceiptRequested: false,
		from: {
			emailAddress: {
				address: 'sender@example.com',
				name: 'Sample Sender',
			},
		},
		sender: {
			emailAddress: {
				address: 'sender@example.com',
				name: 'Sample Sender',
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
