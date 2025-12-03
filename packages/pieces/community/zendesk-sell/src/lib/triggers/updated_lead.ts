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
    status?: string;
    updated_at: string;
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

export const updatedLead = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_lead',
    displayName: 'Updated Lead',
    description: 'Fires when an existing lead record is updated (polls for updates).',
    props: {},
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "owner_id": 1,
        "first_name": "Mark",
        "last_name": "Johnson",
        "organization_name": "Design Services Inc.",
        "status": "Contacted",
        "source_id": 10,
        "title": "Senior Designer",
        "description": "Updated description.",
        "email": "mark.johnson@example.com",
        "phone": "508-778-6516",
        "mobile": "508-778-6517",
        "created_at": "2024-08-27T16:32:56Z",
        "updated_at": "2025-10-18T10:25:00Z"
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