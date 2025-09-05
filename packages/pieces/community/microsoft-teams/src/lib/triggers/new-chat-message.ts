import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { ChatMessage } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

import { isNil } from '@activepieces/shared';

type Props = {
	chatId: string;
};

export const newChatMessageTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-chat-message',
	displayName: 'New Chat Message',
	description: 'Triggers when a new message is received in a chat.',
	props: {
		chatId: microsoftTeamsCommon.chatId,
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
		'@odata.context': 'https://graph.microsoft.com/v1.0/$metadata#chats(\'19%3A8ea0e38b-efb3-4757-924a-5f94061cf8c2_97f62344-57dc-409c-88ad-c4af14158ff5%40unq.gbl.spaces\')/messages/$entity',
		id: '1612289992105',
		replyToId: null,
		etag: '1612289992105',
		messageType: 'message',
		createdDateTime: '2021-02-02T18:19:52.105Z',
		lastModifiedDateTime: '2021-02-02T18:19:52.105Z',
		lastEditedDateTime: null,
		deletedDateTime: null,
		subject: null,
		summary: null,
		chatId: '19:8ea0e38b-efb3-4757-924a-5f94061cf8c2_97f62344-57dc-409c-88ad-c4af14158ff5@unq.gbl.spaces',
		importance: 'normal',
		locale: 'en-us',
		webUrl: null,
		channelIdentity: null,
		policyViolation: null,
		eventDetail: null,
		from: {
			application: null,
			device: null,
			conversation: null,
			user: {
				'@odata.type': '#microsoft.graph.teamworkUserIdentity',
				id: '8ea0e38b-efb3-4757-924a-5f94061cf8c2',
				displayName: 'Robin Kline',
				userIdentityType: 'aadUser',
				tenantId: 'e61ef81e-8bd8-476a-92e8-4a62f8426fca',
			},
		},
		body: {
			contentType: 'text',
			content: 'test',
		},
		attachments: [],
		mentions: [],
		reactions: [],
		messageHistory: [],
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const { chatId } = propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const messages: ChatMessage[] = [];

		if (lastFetchEpochMS === 0) {
			// First run: get the most recent 5 messages to avoid overwhelming
			const response: PageCollection = await client
				.api(`/chats/${chatId}/messages`)
				.top(5)
				.get();

			if (!isNil(response.value)) {
				messages.push(...response.value);
			}
		} else {
			// Subsequent runs: use delta queries for efficient polling
			const requestUrl =
				(await store.get<string>('deltalink')) ??
				`/chats/${chatId}/messages/delta`;
			let nextLink: string | null = requestUrl;

			// https://learn.microsoft.com/en-us/graph/api/chatmessage-delta?view=graph-rest-1.0&tabs=http
			while (nextLink) {
				const response: PageCollection = await client.api(nextLink).get();
				const chatMessages = response.value as ChatMessage[];

				if (Array.isArray(chatMessages)) {
					messages.push(...chatMessages);
				}

				nextLink = response['@odata.nextLink'] ?? null;

				if (response['@odata.deltaLink']) {
					await store.put<string>('deltalink', response['@odata.deltaLink']);
				}
			}
		}

		return messages.map((message: ChatMessage) => {
			return {
				epochMilliSeconds: dayjs(message.createdDateTime).valueOf(),
				data: message,
			};
		});
	},
};