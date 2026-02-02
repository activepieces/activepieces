import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema,
    AppConnectionValueForAuthProperty
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';

interface ZendeskLeadItem {
    data: ZendeskLead;
    meta: { type: string };
}
interface ZendeskLead {
    id: number;
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    email?: string;
    created_at: string;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof zendeskSellAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const response = await callZendeskApi<{ items: ZendeskLeadItem[] }>(
			HttpMethod.GET,
			'v2/leads',
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

export const newLead = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Fires when a new lead is created (polls for new records).',
    props: {},
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "owner_id": 1,
        "first_name": "Mark",
        "last_name": "Johnson",
        "organization_name": "Design Services Company",
        "status": "New",
        "source_id": 10,
        "email": "mark@example.com",
        "phone": "508-778-6516",
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2014-08-27T16:32:56Z"
    },
    type: TriggerStrategy.POLLING,

    async test(context) {
        return await pollingHelper.test(polling, context);
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

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});