import { PiecePropValueSchema, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { whatconvertsAuth } from '../common/auth';
import { whatconvertsCommon } from '../common/client';

type Props = {};

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

        try {
            const response = await whatconvertsCommon.apiCall({
                auth: auth,
                method: HttpMethod.GET,
                resourceUri: '/leads',
                queryParams: queryParams
            });

            const leads = response.body?.leads || response.body || [];

            const updatedLeads = leads.filter((lead: any) => {
                const updatedAt = dayjs(lead.last_updated || lead.updated_at);
                return updatedAt.isAfter(dayjs(lastFetchEpochMS || 0));
            });

            return updatedLeads.map((lead: any) => ({
                epochMilliSeconds: dayjs(lead.last_updated || lead.updated_at).valueOf(),
                data: lead,
            }));
        } catch (error) {
            console.warn('Failed to fetch updated leads:', error);
            return [];
        }
    },
};

export const updatedLead = createTrigger({
    auth: whatconvertsAuth,
    name: 'updated_lead',
    displayName: 'Updated Lead',
    description: 'Fires when an existing lead is updated in WhatConverts.',
    props: {},
    sampleData: {
        "account_id": 13744,
        "profile_id": 42167,
        "profile": "WhatConverts",
        "lead_id": 148099,
        "user_id": "51497-af17340d-62b8-3044-423f-3dc754e621c2",
        "lead_type": "phone_call",
        "lead_status": "unique",
        "date_created": "2025-09-20T16:21:22Z",
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
