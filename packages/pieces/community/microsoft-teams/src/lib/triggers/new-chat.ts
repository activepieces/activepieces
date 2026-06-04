import { microsoftTeamsAuth } from '../auth';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	AppConnectionValueForAuthProperty,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { createGraphClient, withGraphRetry } from '../common/graph';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { Chat, ChatType } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

type Props = {
	chatType?: ChatType;
};

export const newChatTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-chat',
	displayName: 'New Chat',
	description: 'Triggers when a new chat is created.',
	props: {},
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

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const cloud = auth.props?.['cloud'] as string | undefined;
		const client = createGraphClient(auth.access_token, cloud);
		const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();

		const chats: Chat[] = [];
		const filter =
			lastFetchEpochMS === 0
				? '$top=10'
				: `$filter=createdDateTime gt ${lastFetchDate}`;

		let response: PageCollection = await withGraphRetry(() =>
			client.api(`/chats?${filter}`).get(),
		);

		while (response.value && response.value.length > 0) {
			for (const channel of response.value as Chat[]) {
				if (isNil(channel.createdDateTime)) {
					continue;
				}
				chats.push(channel);
			}
			const nextLink = response['@odata.nextLink'];
			if (lastFetchEpochMS !== 0 && nextLink) {
				response = await withGraphRetry(() => client.api(nextLink).get());
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
