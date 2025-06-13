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
	teamId: string;
	channelId: string;
};

export const newChannelMessageTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-channel-message',
	displayName: 'New Channel Message',
	description: 'Triggers when a new message is posted in a channel.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
		channelId: microsoftTeamsCommon.channelId,
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
		subject: 'Test',
		summary: null,
		chatId: null,
		importance: 'normal',
		locale: 'en-us',
		webUrl:'',
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
		channelIdentity: {
			teamId: '99cb9-7ebe-43ee-a69b-5f77ce8a4b4e',
			channelId: '19:LiZnIkTo_1FmFY9OTsfym0q3bwo-y2UfV9FaYA1@thread.tacv2',
		},
		attachments: [],
		mentions: [],
		reactions: [],
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS, store }) {
		const { teamId, channelId } = propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const messages: ChatMessage[] = [];

		if (lastFetchEpochMS === 0) {
			const response: PageCollection = await client
				.api(`/teams/${teamId}/channels/${channelId}/messages`)
				.top(5)
				.get();

			if (!isNil(response.value)) {
				messages.push(...response.value);
			}
		} else {
			const requestUrl =
				(await store.get<string>('deltalink')) ??
				`/teams/${teamId}/channels/${channelId}/messages/delta`;
			let nextLink: string | null = requestUrl;

			// https://learn.microsoft.com/en-us/graph/api/chatmessage-delta?view=graph-rest-1.0&tabs=http
			while (nextLink) {
				const response: PageCollection = await client.api(nextLink).get();
				const channelMessages = response.value as ChatMessage[];

				if (Array.isArray(channelMessages)) {
					messages.push(...channelMessages);
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
