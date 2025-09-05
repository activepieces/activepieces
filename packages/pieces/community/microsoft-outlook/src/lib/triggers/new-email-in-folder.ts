import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	PiecePropValueSchema,
	TriggerStrategy,
	createTrigger,
	Property,
	OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message, MailFolder } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';

const polling: Polling<PiecePropValueSchema<typeof microsoftOutlookAuth>, { folderId: string }> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, lastFetchEpochMS, propsValue }) => {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const messages = [];
		const folderId = propsValue.folderId;

		const filter =
			lastFetchEpochMS === 0
				? '$top=10'
				: `$filter=receivedDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;

		let response: PageCollection = await client
			.api(`/me/mailFolders/${folderId}/messages?${filter}`)
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

		if (messages.length === 0 && lastFetchEpochMS === 0) {
			return [{
				epochMilliSeconds: Date.now(),
				data: {
					id: 'sample-message-id',
					subject: 'Sample Email in Folder',
					from: {
						emailAddress: {
							name: 'Bob Johnson',
							address: 'bob.johnson@example.com'
						}
					},
					toRecipients: [{
						emailAddress: {
							name: 'You',
							address: 'you@example.com'
						}
					}],
					receivedDateTime: new Date().toISOString(),
					bodyPreview: 'This is a sample email in the selected folder.',
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

export const newEmailInFolderTrigger = createTrigger({
	auth: microsoftOutlookAuth,
	name: 'newEmailInFolder',
	displayName: 'New Email in Folder',
	description: 'Triggers when a new email is delivered into the specified folder.',
	props: {
		folderId: Property.Dropdown({
			displayName: 'Folder',
			required: true,
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
