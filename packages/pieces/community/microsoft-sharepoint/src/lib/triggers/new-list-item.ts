import { microsoftSharePointAuth } from '../../';
import {
	createTrigger,
	TriggerStrategy,
	PiecePropValueSchema,
	AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { microsoftSharePointCommon } from '../common';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { ListItem } from '@microsoft/microsoft-graph-types';

type Props = {
	siteId: string;
	listId: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof microsoftSharePointAuth>, Props> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const { siteId, listId } = propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const items = [];

		const filter =
			lastFetchEpochMS === 0 ? `$filter=createdDateTime gt ${dayjs().toISOString()}` : '$top=10';


		let response: PageCollection = await client
			.api(`/sites/${siteId}/lists/${listId}/items?${filter}`)
			.expand('fields')
			.get();

		if (lastFetchEpochMS === 0) {
			for (const message of response.value as ListItem[]) {
				items.push(message);
			}
		} else {
			while (response.value.length > 0) {
				for (const message of response.value as ListItem[]) {
					items.push(message);
				}

				if (response['@odata.nextLink']) {
					response = await client.api(response['@odata.nextLink']).get();
				} else {
					break;
				}
			}
		}

		items.sort((a, b) => {
			const aDate = dayjs(a.createdDateTime);
			const bDate = dayjs(b.createdDateTime);
			return bDate.diff(aDate);
		});

		return items.map((item) => ({
			epochMilliSeconds: dayjs(item.createdDateTime).valueOf(),
			data: item,
		}));
	},
};

export const newListItemTrigger = createTrigger({
	auth: microsoftSharePointAuth,
	name: 'new_list_item',
	displayName: 'New List Item',
	description: 'Triggers when a new item is created in a SharePoint list.',
	props: {
		siteId: microsoftSharePointCommon.siteId,
		listId: microsoftSharePointCommon.listId,
	},
	type: TriggerStrategy.POLLING,

	sampleData: undefined,
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
