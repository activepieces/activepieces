import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema,
    AppConnectionValueForAuthProperty
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common/client';

interface ZendeskContactItem {
    data: ZendeskContact;
    meta: { type: string };
}
interface ZendeskContact {
    id: number;
    name: string;
    email?: string;
    updated_at: string;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof zendeskSellAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }  ) {
		const response = await callZendeskApi<{ items: ZendeskContactItem[] }>(
			HttpMethod.GET,
			'v2/contacts',
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

export const updatedContact = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_contact',
    displayName: 'Updated Contact',
    description: 'Fires when an existing contact is updated (polls for updates).',
    props: {},
    sampleData: {
        "id": 2,
        "creator_id": 1,
        "owner_id": 1,
        "is_organization": false,
        "contact_id": 1,
        "name": "Mark Johnson",
        "first_name": "Mark",
        "last_name": "Johnson",
        "customer_status": "current",
        "email": "mark@designservice.com",
        "phone": "508-778-6516",
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2025-10-18T10:30:00Z"
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