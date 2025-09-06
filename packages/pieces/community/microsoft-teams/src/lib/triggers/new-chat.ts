import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
	Property,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Chat } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

import { isNil } from '@activepieces/shared';

type Props = {
	chatType?: string;
};

export const newChatTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-chat',
	displayName: 'New Chat',
	description: 'Triggers when a new 1-on-1 or group chat is created.',
	props: {
		chatType: Property.StaticDropdown({
			displayName: 'Chat Type Filter',
			description: 'Filter by specific chat type (optional)',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'All Chats',
						value: 'all',
					},
					{
						label: 'One-on-One Only',
						value: 'oneOnOne',
					},
					{
						label: 'Group Only',
						value: 'group',
					},
					{
						label: 'Meeting Only',
						value: 'meeting',
					},
				],
			},
		}),
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
	sampleData: {
		'@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#chats/$entity',
		id: '19:8b081ef6-4792-4def-b2c9-c363a1bf41d5_877192bd-9183-47d3-a74c-8aa0426716cf@unq.gbl.spaces',
		topic: null,
		createdDateTime: '2019-04-18T23:51:42.099Z',
		lastUpdatedDateTime: '2019-04-18T23:51:43.255Z',
		chatType: 'oneOnOne',
		webUrl: 'https://teams.microsoft.com/l/chat/19%3A8b081ef6-4792-4def-b2c9-c363a1bf41d5_877192bd-9183-47d3-a74c-8aa0426716cf@unq.gbl.spaces/0?tenantId=2432b57b-0abd-43db-aa7b-16eadd115d34',
		tenantId: '2432b57b-0abd-43db-aa7b-16eadd115d34',
		onlineMeetingInfo: null,
		viewpoint: {
			isHidden: false,
			lastMessageReadDateTime: '2021-07-06T22:26:27.98Z',
		},
		isHiddenForAllMembers: false,
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const { chatType } = propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const chats: Chat[] = [];

		// Get all chats for the current user
		// Note: Microsoft Graph doesn't support delta queries for chats, so we'll use regular polling
		const response: PageCollection = await client
			.api('/me/chats')
			.expand('members')
			.get();

		if (!isNil(response.value)) {
			let allChats = response.value as Chat[];
			
			// Filter by chat type if specified
			if (chatType && chatType !== 'all') {
				allChats = allChats.filter((chat: Chat) => chat.chatType === chatType);
			}
			
			// Filter chats created after the last fetch time
			if (lastFetchEpochMS === 0) {
				// First run: return the most recent 5 chats to avoid overwhelming
				chats.push(...allChats.slice(-5));
			} else {
				// Subsequent runs: only return chats created after last fetch
				const lastFetchTime = new Date(lastFetchEpochMS);
				const newChats = allChats.filter((chat: Chat) => {
					const chatCreatedTime = new Date(chat.createdDateTime!);
					return chatCreatedTime > lastFetchTime;
				});
				chats.push(...newChats);
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