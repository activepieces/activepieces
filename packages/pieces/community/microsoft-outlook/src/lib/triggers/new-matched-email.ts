import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	PiecePropValueSchema,
	TriggerStrategy,
	createTrigger,
	Property,
	OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';

const polling: Polling<PiecePropValueSchema<typeof microsoftOutlookAuth>, { searchQuery: string; folderId?: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS, propsValue }) => {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const messages: Message[] = [];
		const { searchQuery, folderId } = propsValue;

		const baseUrl = folderId ? `/me/mailFolders/${folderId}/messages` : '/me/messages';
		const searchParam = searchQuery ? `$search="${searchQuery}"` : '';
		const timeFilter = lastFetchEpochMS === 0 
			? '$top=10' 
			: `$filter=receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;
		
		let queryParams: string;
		if (searchQuery && lastFetchEpochMS > 0) {
			queryParams = `${searchParam}&$top=50`;
		} else {
			queryParams = [searchParam, timeFilter].filter(Boolean).join('&');
		}
		const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;

		const headers: Record<string, string> = {};
		if (searchQuery) {
			headers['ConsistencyLevel'] = 'eventual';
			headers['Prefer'] = 'outlook.body-content-type="text"';
		}

		let response: PageCollection;
		if (searchQuery) {
			response = await client
				.api(url)
				.headers(headers)
				.get();
		} else {
			response = await client
				.api(url)
				.headers(headers)
				.orderby('receivedDateTime desc')
				.get();
		}

		const processMessages = (messageList: Message[]): void => {
			for (const message of messageList) {
				if (lastFetchEpochMS === 0 || dayjs(message.receivedDateTime).valueOf() > lastFetchEpochMS) {
					messages.push(message);
				}
			}
		};

		if (lastFetchEpochMS === 0) {
			processMessages(response.value as Message[]);
		} else {
			while (response.value.length > 0) {
				processMessages(response.value as Message[]);

				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
		}

		if (searchQuery) {
			messages.sort((a, b) => dayjs(b.receivedDateTime).valueOf() - dayjs(a.receivedDateTime).valueOf());
		}

		if (messages.length === 0 && lastFetchEpochMS === 0) {
			return [{
				epochMilliSeconds: Date.now(),
				data: {
					id: 'sample-message-id',
					subject: 'Sample Matched Email',
					from: {
						emailAddress: {
							name: 'Jane Smith',
							address: 'jane.smith@example.com'
						}
					},
					toRecipients: [{
						emailAddress: {
							name: 'You',
							address: 'you@example.com'
						}
					}],
					receivedDateTime: new Date().toISOString(),
					bodyPreview: 'This is a sample email that matches your search criteria.',
					hasAttachments: false
				}
			}];
		}

		return messages.map((message) => ({
			epochMilliSeconds: dayjs(message.receivedDateTime).valueOf(),
			data: message,
		}));
	},
};

export const newMatchedEmailTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newMatchedEmail',
	displayName: 'New Matched Email',
	description: 'Triggers when a new email matches the provided search query.',
	props: {
		searchQuery: Property.ShortText({
			displayName: 'Search Query',
			description: 'Search terms to match emails (e.g., "from:john@example.com", "subject:urgent", "hasAttachments:true")',
			required: true,
		}),
		folderId: Property.Dropdown({
			displayName: 'Folder (Optional)',
			description: 'Search in a specific folder. Leave empty to search all folders.',
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
