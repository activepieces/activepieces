import { microsoftTeamsAuth } from '../auth';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/pieces-framework';
import { microsoftTeamsClient } from '../common/client';
import type { Chat, MicrosoftTeamsPage } from '../common/types';
import dayjs from 'dayjs';

type Props = Record<string, never>;

export const newChatTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-chat',
	classification: 'READ',
	displayName: 'New Chat',
	description: 'Triggers when a new chat is created.',
	aiMetadata: {
		description: 'Fires when a new chat (one-on-one or group) involving the authenticated user is created in Microsoft Teams. Each event represents the newly created chat and its metadata. Polls periodically by creation time, so events appear with a short delay rather than instantly.',
	},
	props: {},
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
		id: '19:example_chat_id@unq.gbl.spaces',
		createdDateTime: '2025-05-21T12:40:13.175Z',
		lastUpdatedDateTime: '2025-05-21T12:40:13.175Z',
		chatType: 'oneOnOne',
		webUrl: '',
		isHiddenForAllMembers: false,
	},
});

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const client = microsoftTeamsClient.create({ auth });
		const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();

		const chats: Chat[] = [];
		const filter =
			lastFetchEpochMS === 0
				? '$top=10'
				: `$filter=createdDateTime gt ${lastFetchDate}`;

		let response: MicrosoftTeamsPage<Chat> = await microsoftTeamsClient.withRetry(() =>
			client.api(`/chats?${filter}`).get(),
		);

		while (response.value && response.value.length > 0) {
			for (const channel of response.value) {
				if (isNil(channel.createdDateTime)) {
					continue;
				}
				chats.push(channel);
			}
			const nextLink = response['@odata.nextLink'];
			if (lastFetchEpochMS !== 0 && nextLink) {
				response = await microsoftTeamsClient.withRetry(() => client.api(nextLink).get());
			} else {
				break;
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
