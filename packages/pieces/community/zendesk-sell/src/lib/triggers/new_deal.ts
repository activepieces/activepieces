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
    contact_id: number;
    value: string;
    stage_id: number;
    created_at: string;
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
				sort_by: 'created_at:desc',
				per_page: lastFetchEpochMS === 0 ? '10' : '100',
			}
		);

		return response.body.items.map((item) => ({
			epochMilliSeconds: new Date(item.data.created_at).getTime(),
			data: item.data,
		}));
	},
};

export const newDeal = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_deal',
    displayName: 'New Deal',
    description: 'Fires when a new deal is created (polls for new records).',
    props: {},
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "owner_id": 1,
        "contact_id": 1,
        "name": "Website Redesign",
        "value": "15000.0",
        "currency": "USD",
        "hot": false,
        "stage_id": 12,
        "created_at": "2025-10-27T10:30:00Z",
        "updated_at": "2025-10-27T10:30:00Z",
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