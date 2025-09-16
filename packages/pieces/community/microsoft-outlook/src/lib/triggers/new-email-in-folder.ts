import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	PiecePropValueSchema,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftOutlookAuth } from '../common/auth';
import { mailFolderIdDropdown } from '../common/props';

const polling: Polling<PiecePropValueSchema<typeof microsoftOutlookAuth>, { folderId?: string }> = {
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
				: `$filter=createdDateTime gt ${dayjs(lastFetchEpochMS).toISOString()}`;

		let response: PageCollection = await client
			.api(`/me/mailFolders/${folderId}/messages?${filter}`)
			.orderby('createdDateTime desc')
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
			epochMilliSeconds: dayjs(message.createdDateTime).valueOf(),
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
		folderId: mailFolderIdDropdown({
			displayName: 'Folder',
			description: '',
			required: true,
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
