import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Channel } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';
import { microsoftTeamsCommon } from '../common';

type Props = {
	teamId: string;
};

export const newChannelTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-channel',
	displayName: 'New Channel',
	description: 'Fires when a new channel is created within a team.',
	props: {
		teamId: microsoftTeamsCommon.teamId,
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
		id: '19:LiZnIkTo_1FmFY9OTsfym0q3bwo-y2UfV9FaYA1@thread.tacv2',
		displayName: 'General',
		description: 'General discussion for the team',
		createdDateTime: '2024-01-15T10:30:00.000Z',
		lastUpdatedDateTime: '2024-01-15T10:30:00.000Z',
		webUrl: 'https://teams.microsoft.com/l/channel/19%3ALiZnIkTo_1FmFY9OTsfym0q3bwo-y2UfV9FaYA1%40thread.tacv2/General?groupId=99cb9-7ebe-43ee-a69b-5f77ce8a4b4e&tenantId=12345678-1234-1234-1234-123456789012',
		email: 'general@teams.microsoft.com',
		tenantId: '12345678-1234-1234-1234-123456789012',
		moderationSettings: {
			userNewMessageRestriction: 'everyone',
			replyRestriction: 'everyone',
			allowNewMessageFromBots: true,
			allowNewMessageFromConnectors: true,
		},
	},
});

const polling: Polling<PiecePropValueSchema<typeof microsoftTeamsAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, propsValue, lastFetchEpochMS }) {
		const { teamId } = propsValue;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const channels: Channel[] = [];

		if (lastFetchEpochMS === 0) {
			// First run - get recent channels
			const response: PageCollection = await client
				.api(`/teams/${teamId}/channels`)
				.top(10)
				.get();

			if (response.value) {
				channels.push(...response.value);
			}
		} else {
			// Subsequent runs - get all channels and filter by creation time
			let nextLink: string | null = `/teams/${teamId}/channels`;
			
			while (nextLink) {
				const response: PageCollection = await client.api(nextLink).get();
				const allChannels = response.value as Channel[];

				if (Array.isArray(allChannels)) {
					// Filter channels created after last fetch
					const newChannels = allChannels.filter(channel => {
						const channelCreatedTime = dayjs(channel.createdDateTime).valueOf();
						return channelCreatedTime > lastFetchEpochMS;
					});
					channels.push(...newChannels);
				}

				nextLink = response['@odata.nextLink'] ?? null;
			}
		}

		return channels.map((channel: Channel) => {
			return {
				epochMilliSeconds: dayjs(channel.createdDateTime).valueOf(),
				data: channel,
			};
		});
	},
};
