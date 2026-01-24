import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema,
    AppConnectionValueForAuthProperty
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';

interface ZendeskDealItem {
    data: ZendeskDeal;
    meta: { type: string };
}
interface ZendeskDeal {
    id: number;
    name: string;
    value: string;
    stage_id: number;
    contact_id: number;
    owner_id: number;
    updated_at: string;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof zendeskSellAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const response = await callZendeskApi<{ items: ZendeskDealItem[] }>(
			HttpMethod.GET,
			'v2/deals',
			auth,
			undefined,
			{
				sort_by: 'updated_at:desc',
				per_page: lastFetchEpochMS === 0 ? '10' : '100',
			}
		);

		return response.body.items.map((item) => ({
			epochMilliSeconds: new Date(item.data.updated_at).getTime(),
			data: item.data,
		}));
	},
};

export const updatedDeal = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_deal',
    displayName: 'Updated Deal',
    description: 'Fires when an existing deal is modified (polls for updates).',
    props: {},
    sampleData: {
        "id": 123,
        "contact_id": 456,
        "name": "Updated Deal Name",
        "value": "25000.0",
        "currency": "USD",
        "owner_id": 789,
        "stage_id": 1,
        "created_at": "2025-10-20T10:00:00Z",
        "updated_at": "2025-10-27T01:21:00Z"
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
});