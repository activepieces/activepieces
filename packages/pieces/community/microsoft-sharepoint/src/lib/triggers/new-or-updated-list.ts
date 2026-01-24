import { microsoftSharePointAuth } from '../../';
import {
	createTrigger,
	TriggerStrategy,
	AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { List } from '@microsoft/microsoft-graph-types';

type Props = {
	siteId: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftSharePointAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const { siteId } = propsValue;
		const isTestMode = lastFetchEpochMS === 0;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const lists = [];

		let response: PageCollection = await client
			.api(`/sites/${siteId}/lists`)
			.get();

		let stop = false;

		while (!stop && response.value.length > 0) {
			for (const item of response.value as List[]) {
				const modifiedMs = dayjs(item.lastModifiedDateTime).valueOf();

				if (isTestMode) {
					lists.push(item);
					if (lists.length >= 10) {
						stop = true;
					}
					continue;
				}

				if (modifiedMs < lastFetchEpochMS) {
					stop = true;
					break;
				}

				lists.push(item);
			}

			if (stop || !response['@odata.nextLink']) break;

			response = await client.api(response['@odata.nextLink']).get();
		}

		lists.sort((a, b) => {
			const aDate = dayjs(a.lastModifiedDateTime);
			const bDate = dayjs(b.lastModifiedDateTime);
			return bDate.diff(aDate);
		});

		return lists.map((list) => ({
			epochMilliSeconds: dayjs(list.lastModifiedDateTime).valueOf(),
			data: list,
		}));
	},
};

export const newOrUpdatedListTrigger = createTrigger({
	auth: microsoftSharePointAuth,
	name: 'new_or_updated_list',
	displayName: 'New or Updated List',
	description: 'Triggers when a list is created or updated in a site.',
	props: {
		siteId: microsoftSharePointCommon.siteId,
	},
	type: TriggerStrategy.POLLING,

	sampleData: {
		id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
		displayName: 'Projects Tracker',
		description: 'Updated list for tracking all ongoing projects.',
		createdDateTime: '2025-09-26T11:00:00Z',
		lastModifiedDateTime: '2025-09-26T14:55:00Z',
		webUrl: 'https://contoso.sharepoint.com/sites/MySite/Lists/Projects%20Tracker',
	},
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
});
