import { PiecePropValueSchema, createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { whatconvertsAuth } from '../common/auth';
import { whatconvertsCommon } from '../common/client';

type Props = {
    lead_type?: string;
};

const props = {
    lead_type: Property.StaticDropdown({
        displayName: 'Lead Type Filter',
        description: 'Only trigger for leads of this specific type. Leave empty to trigger for all lead types.',
        required: false,
        options: {
            options: [
                { label: 'Phone Call', value: 'phone_call' },
                { label: 'Web Form', value: 'web_form' },
                { label: 'Chat', value: 'chat' },
                { label: 'Text Message', value: 'text_message' },
                { label: 'Email', value: 'email' },
                { label: 'Appointment', value: 'appointment' },
                { label: 'Event', value: 'event' },
                { label: 'Transaction', value: 'transaction' },
                { label: 'Other', value: 'other' }
            ]
        }
    })
};

const polling: Polling<PiecePropValueSchema<typeof whatconvertsAuth>, Props> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const lastFetchDate = lastFetchEpochMS ? dayjs(lastFetchEpochMS).format('YYYY-MM-DD') : dayjs().subtract(1, 'hour').format('YYYY-MM-DD');

        const queryParams: Record<string, string> = {
            start_date: lastFetchDate,
            end_date: dayjs().format('YYYY-MM-DD'),
            leads_per_page: '100',
            order: 'desc'
        };

        const props = propsValue as any;
        if (props['lead_type']) {
            queryParams['lead_type'] = props['lead_type'];
        }

        try {
            const response = await whatconvertsCommon.apiCall({
                auth: auth,
                method: HttpMethod.GET,
                resourceUri: '/leads',
                queryParams: queryParams
            });

            const leads = response.body?.leads || response.body || [];

            const newLeads = leads.filter((lead: any) => {
                const createdAt = dayjs(lead.date_created || lead.created_at);
                return createdAt.isAfter(dayjs(lastFetchEpochMS || 0));
            });

            return newLeads.map((lead: any) => ({
                epochMilliSeconds: dayjs(lead.date_created || lead.created_at).valueOf(),
                data: lead,
            }));
        } catch (error) {
            console.warn('Failed to fetch new leads:', error);
            return [];
        }
    },
};

export const newLead = createTrigger({
    auth: whatconvertsAuth,
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Fires when a new lead is received in WhatConverts. Optionally filter by specific lead type.',
    props,
    sampleData: {
        "account_id": 13744,
        "profile_id": 42167,
        "profile": "WhatConverts",
        "lead_id": 148099,
        "user_id": "51497-af17340d-62b8-3044-423f-3dc754e621c2",
        "lead_type": "phone_call",
        "lead_status": "unique",
        "date_created": "2025-09-21T16:21:22Z",
        "quotable": "yes",
        "quote_value": 251,
        "sales_value": 750,
        "lead_score": 50,
        "lead_source": "google",
        "lead_medium": "cpc",
        "lead_campaign": "call tracking general",
        "lead_url": "https://www.whatconverts.com/contact",
        "landing_url": "https://www.whatconverts.com/",
        "contact_name": "Jeremy Helms",
        "contact_email_address": "hello@whatconverts.com",
        "contact_phone_number": "+18883435680",
        "phone_number": "+18883435680",
        "tracking_number": "+17047349155",
        "caller_number": "+15432245114",
        "city": "Charlotte",
        "state": "NC",
        "zip": "28226",
        "country": "US",
        "call_duration_seconds": 175,
        "last_updated": "2025-09-21T17:18:20Z"
    },
    type: TriggerStrategy.POLLING,

    async test(context) {
        return await pollingHelper.test(polling, context);
    },

    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
        });
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            store: context.store,
            auth: context.auth,
            propsValue: context.propsValue,
        });
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
