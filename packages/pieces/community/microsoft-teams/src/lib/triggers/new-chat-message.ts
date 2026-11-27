import { microsoftTeamsAuth } from '../auth';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftTeamsProps } from '../common/props';
import { microsoftTeamsClient } from '../common/client';
import { microsoftTeamsUtils } from '../common/utils';
import type { ChatMessage, MicrosoftTeamsPage } from '../common/types';
import dayjs from 'dayjs';

import { newChatMessageOutputSchema } from '../output-schemas';

export const newChatMessageTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-chat-message',
	outputSchema: newChatMessageOutputSchema,
	classification: 'READ',
	displayName: 'New Chat Message',
	description: 'Triggers when a new message is posted in a chat.',
	aiMetadata: {
		description: 'Fires when a new message is received in the selected Microsoft Teams chat (by chat ID). Each event represents the new chat message and its content. Polls periodically, so events appear with a short delay rather than instantly.',
	},
	props: {
		chatId: microsoftTeamsProps.chatId({ required: true }),
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
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

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const { chatId } = propsValue;
		const client = microsoftTeamsClient.create({ auth });

		const messages =
			lastFetchEpochMS === 0
				? await listLatestMessages({ client, chatId })
				: await listMessagesChangedSince({ client, chatId, since: lastFetchEpochMS });

		return messages.filter(microsoftTeamsUtils.isPostedMessage).map((message: ChatMessage) => {
			return {
				epochMilliSeconds: dayjs(message.createdDateTime).valueOf(),
				data: message,
			};
		});
	},
};

async function listLatestMessages({ client, chatId }: { client: Client; chatId: string }): Promise<ChatMessage[]> {
	const response: MicrosoftTeamsPage<ChatMessage> = await microsoftTeamsClient.withRetry(() =>
		client.api(`/chats/${chatId}/messages`).top(5).get(),
	);
	return response.value ?? [];
}

async function listMessagesChangedSince({
	client,
	chatId,
	since,
}: {
	client: Client;
	chatId: string;
	since: number;
}): Promise<ChatMessage[]> {
	const messages: ChatMessage[] = [];
	let response: MicrosoftTeamsPage<ChatMessage> = await microsoftTeamsClient.withRetry(() =>
		client
			.api(`/chats/${chatId}/messages`)
			.filter(`lastModifiedDateTime gt ${new Date(since).toISOString()}`)
			.orderby('lastModifiedDateTime desc')
			.top(PAGE_SIZE)
			.get(),
	);
	messages.push(...(response.value ?? []));
	while (response['@odata.nextLink']) {
		const nextLink = response['@odata.nextLink'];
		response = await microsoftTeamsClient.withRetry(() => client.api(nextLink).get());
		messages.push(...(response.value ?? []));
	}
	return messages;
}

const PAGE_SIZE = 50;

type Props = {
	chatId: string;
};
