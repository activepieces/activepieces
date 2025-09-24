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
		replyToId: null,
		etag: '1747831213175',
		messageType: 'message',
		createdDateTime: '2025-05-21T12:40:13.175Z',
		lastModifiedDateTime: '2025-05-21T12:40:13.175Z',
		lastEditedDateTime: null,
		deletedDateTime: null,
		subject: null,
		summary: null,
		chatId: '19:example_chat_id@unq.gbl.spaces',
		importance: 'normal',
		locale: 'en-us',
		webUrl: '',
		policyViolation: null,
		eventDetail: null,
		id: '1747831213175',
		from: {
			application: null,
			device: null,
			user: {
				'@odata.type': '#microsoft.graph.teamworkUserIdentity',
				id: '90b3720d-f459-42c1-a02e-a1ecb068',
				displayName: 'Activepieces',
				userIdentityType: 'aadUser',
				tenantId: '9b37335a-d996-4a8d-9ae4-a3a04c94',
			},
		},
		body: {
			contentType: 'html',
			content: '<p>Test Message</p>',
		},
		attachments: [],
		mentions: [],
		reactions: [],
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
			const response: PageCollection = await client
				.api(`/chats/${chatId}/messages`)
				.top(5)
				.get();

			if (!isNil(response.value)) {
				messages.push(...(response.value as ChatMessage[]));
			}
		} else {
			const requestUrl =
				(await store.get<string>('deltalink')) ?? `/chats/${chatId}/messages/delta`;
			let nextLink: string | null = requestUrl;

			// https://learn.microsoft.com/graph/api/chatmessage-delta?view=graph-rest-1.0&tabs=http
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


