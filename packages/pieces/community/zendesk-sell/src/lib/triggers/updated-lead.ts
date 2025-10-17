import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common';
import dayjs from 'dayjs';


interface Lead {
    id: number;
    updated_at: string;
    [key: string]: unknown;
}

const polling: Polling<ZendeskSellAuth, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const response = await callZendeskApi<{ items: { data: Lead }[] }>(
            HttpMethod.GET,
            'v2/leads?sort_by=updated_at:desc&per_page=100',
            auth
        );

        const leads = response.body?.items.map(item => item.data) || [];
        
        const newLeads = leads.filter(lead => 
            dayjs(lead.updated_at).valueOf() > lastFetchEpochMS
        );

        return newLeads.reverse().map((lead) => ({
            epochMilliSeconds: dayjs(lead.updated_at).valueOf(),
            data: lead,
        }));
    },
};

export const updatedLead = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_lead',
    displayName: 'Updated Lead',
    description: 'Fires when an existing lead record is updated.',
    props: {},
    sampleData: {
        "id": 1,
        "owner_id": 1,
        "first_name": "Mark",
        "last_name": "Johnson",
        "organization_name": "Design Services Company",
        "status": "New",
        "email": "mark@designservice.com",
        "tags": [ "important", "friend" ],
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2014-08-27T17:32:56Z"
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files
        });
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
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files
        });
    },
});