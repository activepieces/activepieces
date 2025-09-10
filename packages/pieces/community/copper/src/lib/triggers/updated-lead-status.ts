import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperProps } from '../common/props';

// Helper to fetch recently modified leads
async function getUpdatedLeads(auth: PiecePropValueSchema<typeof copperAuth>, lastFetchSeconds: number) {
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.POST,
        url: `https://api.copper.com/developer_api/v1/leads/search`,
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        },
        body: {
            page_size: 200,
            sort_by: "date_modified",
            sort_direction: "asc",
            minimum_modified_date: lastFetchSeconds,
        }
    });
    return response.body;
}

export const updatedLeadStatus = createTrigger({
    name: 'updated_lead_status',
    auth: copperAuth,
    displayName: 'Updated Lead Status',
    description: 'Fires when a lead’s status changes.',
    props: {
        status_id: copperProps.leadStatusId,
    },
    type: TriggerStrategy.POLLING,
    sampleData: { /* Sample data from previous Updated Lead trigger */ },

    async onEnable(context) {
        await context.store.put('lastFetchEpochMs', Date.now());

        const leads = await getUpdatedLeads(context.auth, 0);
        const statuses: Record<string, { status: number }> = {};
        for (const lead of leads) {
            statuses[`lead_${lead.id}`] = { status: lead.status_id };
        }
        await context.store.put('lead_statuses', statuses);
    },

    async onDisable(context) { 
        // No action needed
    },

    async run(context) {
        const lastFetchEpochMs = (await context.store.get<number>('lastFetchEpochMs')) ?? 0;
        const lastStatuses = (await context.store.get<Record<string, { status: number }>>('lead_statuses')) ?? {};
        
        const leads = await getUpdatedLeads(context.auth, Math.floor(lastFetchEpochMs / 1000));
        const newEvents = [];

        for (const lead of leads) {
            const storedState = lastStatuses[`lead_${lead.id}`];
            const newStatus = lead.status_id;

            if (storedState && storedState.status !== newStatus) {
                if (context.propsValue.status_id === undefined || context.propsValue.status_id === newStatus) {
                    newEvents.push(lead);
                }
            }
            lastStatuses[`lead_${lead.id}`] = { status: newStatus };
        }

        await context.store.put('lead_statuses', lastStatuses);
        await context.store.put('lastFetchEpochMs', Date.now());

        return newEvents;
    },

    async test(context) {
        const leads = await getUpdatedLeads(context.auth, 0);
        return leads.slice(-5).reverse();
    },
});