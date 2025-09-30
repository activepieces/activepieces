import { microsoftTeamsAuth } from '../../index';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	createTrigger,
	PiecePropValueSchema,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { microsoftTeamsCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Channel } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

import { isNil } from '@activepieces/shared';

type Props = {
	teamId: string;
};

export const newChannelTrigger = createTrigger({
	auth: microsoftTeamsAuth,
	name: 'new-channel',
	displayName: 'New Channel',
	description: 'Triggers when a new channel is created in a team.',
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
		id: '19:561fbdbbfca848a484f0a6f00ce9dbbd@thread.tacv2',
		createdDateTime: '2025-05-21T12:40:13.175Z',
		displayName: 'General',
		description: 'Auto-generated channel',
		membershipType: 'standard',
		isArchived: false,
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
		const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();

		const channels: Channel[] = [];
		const filter = lastFetchEpochMS === 0 ? '' : `?$filter=createdDateTime gt ${lastFetchDate}`;

		let response: PageCollection = await client.api(`/teams/${teamId}/channels${filter}`).get();

		while (response.value && response.value.length > 0) {
			for (const channel of response.value as Channel[]) {
				if (isNil(channel.createdDateTime)) {
					continue;
				}
				channels.push(channel);
			}
			if (lastFetchEpochMS !== 0 && response['@odata.nextLink']) {
				response = await client.api(response['@odata.nextLink']).get();
			} else {
				break;
			}
		}

		return channels.map((channel: Channel) => {
			return {
				epochMilliSeconds: dayjs(channel.createdDateTime!).valueOf(),
				data: channel,
			};
		});
	},
};
