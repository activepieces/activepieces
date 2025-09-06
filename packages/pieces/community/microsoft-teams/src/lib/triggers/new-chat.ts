import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Chat } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

export const newChatTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-chat',
	displayName: 'New Chat',
	description: 'Triggers when a new 1-on-1 or group chat is created.',
	props: {},
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
	sampleData: {
		id: '19:meeting_M2IzYzczNTItYmY3OC00MDlmLWJjMzUtYmFiMjNlOTY4MGEz@thread.v2',
		topic: 'Project Discussion',
		createdDateTime: '2024-01-15T10:30:00.000Z',
		lastUpdatedDateTime: '2024-01-15T10:30:00.000Z',
		chatType: 'group',
		webUrl: 'https://teams.microsoft.com/l/chat/19%3Ameeting_M2IzYzczNTItYmY3OC00MDlmLWJjMzUtYmFiMjNlOTY4MGEz%40thread.v2/0?tenantId=12345678-1234-1234-1234-123456789012',
		tenantId: '12345678-1234-1234-1234-123456789012',
		onlineMeetingInfo: null,
		viewpoint: {
			isHidden: false,
			lastMessageReadDateTime: null,
		},
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const chats: Chat[] = [];

		if (lastFetchEpochMS === 0) {
			// First run - get recent chats
			const response: PageCollection = await client
				.api('/chats')
				.expand('members')
				.top(10)
				.get();

			if (response.value) {
				chats.push(...response.value);
			}
		} else {
			// Subsequent runs - get all chats and filter by creation time
			let nextLink: string | null = '/chats?$expand=members';
			
			while (nextLink) {
				const response: PageCollection = await client.api(nextLink).get();
				const allChats = response.value as Chat[];

				if (Array.isArray(allChats)) {
					// Filter chats created after last fetch
					const newChats = allChats.filter(chat => {
						const chatCreatedTime = dayjs(chat.createdDateTime).valueOf();
						return chatCreatedTime > lastFetchEpochMS;
					});
					chats.push(...newChats);
				}

				nextLink = response['@odata.nextLink'] ?? null;
			}
		}

		return chats.map((chat: Chat) => {
			return {
				epochMilliSeconds: dayjs(chat.createdDateTime).valueOf(),
				data: chat,
			};
		});
	},
};
