import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Chat, ChatType } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

type Props = {
	chatType?: ChatType;
};

export const newChatTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-chat',
	displayName: 'New Chat',
	description: 'Triggers when a new 1-on-1 or group chat is created.',
	props: {
		chatType: Property.StaticDropdown({
			displayName: 'Chat Type (optional filter)',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'One-on-one', value: 'oneOnOne' },
					{ label: 'Group', value: 'group' },
				],
			},
		}),
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue as Props,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue as Props,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context as any);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context as any);
	},
	sampleData: {
		id: '19:example_chat_id@unq.gbl.spaces',
		createdDateTime: '2025-05-21T12:40:13.175Z',
		lastUpdatedDateTime: '2025-05-21T12:40:13.175Z',
		chatType: 'oneOnOne',
		webUrl: '',
		isHiddenForAllMembers: false,
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const chats: Chat[] = [];
		const filterType = propsValue.chatType;

		if (lastFetchEpochMS === 0) {
			let response: PageCollection = await client.api('/chats').top(5).get();
			if (Array.isArray(response.value)) {
				for (const chat of response.value as Chat[]) {
					if (filterType && chat.chatType !== filterType) continue;
					chats.push(chat);
				}
			}
		} else {
			let response: PageCollection = await client.api('/chats').get();
			while (response.value && response.value.length > 0) {
				for (const chat of response.value as Chat[]) {
					if (filterType && chat.chatType !== filterType) continue;
					if (!chat.createdDateTime) continue;
					if (dayjs(chat.createdDateTime).valueOf() > lastFetchEpochMS) {
						chats.push(chat);
					}
				}
				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
		}

		return chats.map((chat: Chat) => {
			return {
				epochMilliSeconds: dayjs(chat.createdDateTime!).valueOf(),
				data: chat,
			};
		});
	},
};