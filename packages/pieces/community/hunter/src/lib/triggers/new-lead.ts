import { hunterAuth } from '../../index';
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { Lead } from '../common/types';

export const newLeadTrigger = createTrigger({
    auth: hunterAuth,
    name: 'new-lead',
    displayName: 'New Lead',
    description: 'Fires when a new lead is created.',
    type: TriggerStrategy.POLLING,
    props: {},
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue
        });
    },
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
    sampleData: {
        id: 123,
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company: 'Example Inc.',
        position: 'CEO',
        created_at: '2025-07-24T12:00:00Z'
    }
});

const polling: Polling<PiecePropValueSchema<typeof hunterAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    async items({ auth }) {
        const response = await hunterApiCall({
            apiKey: auth,
            endpoint: '/leads',
            method: HttpMethod.GET,
            qparams: { limit: '100' }
        });
        const leads = (response as { data: { leads: Lead[] } }).data?.leads as Lead[];
        return leads.map((lead) => ({
            epochMilliSeconds: new Date(lead.created_at).valueOf(),
            data: lead
        }));
    }
};
