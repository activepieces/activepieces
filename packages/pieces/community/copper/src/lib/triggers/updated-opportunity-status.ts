import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema, Store } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperProps } from '../common/props';


async function getUpdatedOpportunities(auth: PiecePropValueSchema<typeof copperAuth>, lastFetchSeconds: number, pipeline_id?: string) {
    const body: Record<string, unknown> = {
        page_size: 200,
        sort_by: "date_modified",
        sort_direction: "asc",
        minimum_modified_date: lastFetchSeconds,
    };

    if (pipeline_id) {
        body['pipeline_ids'] = [pipeline_id];
    }
    
    const response = await httpClient.sendRequest<any[]>({
        method: HttpMethod.POST,
        url: `https://api.copper.com/developer_api/v1/opportunities/search`,
        headers: {
            'X-PW-AccessToken': auth.token,
            'X-PW-UserEmail': auth.email,
            'X-PW-Application': 'developer_api',
            'Content-Type': 'application/json',
        },
        body: body
    });
    return response.body;
}

export const updatedOpportunityStatus = createTrigger({
    name: 'updated_opportunity_status',
    auth: copperAuth,
    displayName: 'Updated Opportunity Status',
    description: 'Fires when an opportunity\'s status changes.',
    props: {
        pipeline_id: copperProps.optionalPipelineId,
        status: Property.StaticDropdown({
            displayName: "To Status",
            description: "Optionally, trigger only when an opportunity moves to this specific status.",
            required: false,
            options: {
                options: [
                    { label: "Open", value: 0 },
                    { label: "Won", value: 1 },
                    { label: "Lost", value: 2 },
                    { label: "Abandoned", value: 3 },
                ]
            }
        })
    },
    type: TriggerStrategy.POLLING,
    sampleData: { /* Sample data from previous Updated Opportunity trigger */ },

    async onEnable(context) {
       
        await context.store.put('lastFetchEpochMs', Date.now());

        const opportunities = await getUpdatedOpportunities(context.auth, 0, context.propsValue.pipeline_id);
        const statuses: Record<string, { status: number }> = {};
        for (const opp of opportunities) {
            statuses[`opp_${opp.id}`] = { status: opp.status_id };
        }
        await context.store.put('opportunity_statuses', statuses);
    },

    async onDisable(context) { 
        
    },

    async run(context) {
        
        const lastFetchEpochMs = (await context.store.get<number>('lastFetchEpochMs')) ?? 0;
        const lastStatuses = (await context.store.get<Record<string, { status: number }>>('opportunity_statuses')) ?? {};
        
        const opportunities = await getUpdatedOpportunities(context.auth, Math.floor(lastFetchEpochMs / 1000), context.propsValue.pipeline_id);
        const newEvents = [];

        for (const opp of opportunities) {
            const storedState = lastStatuses[`opp_${opp.id}`];
            const newStatus = opp.status_id;

            if (storedState && storedState.status !== newStatus) {
                if (context.propsValue.status === undefined || context.propsValue.status === newStatus) {
                    newEvents.push(opp);
                }
            }
            
            lastStatuses[`opp_${opp.id}`] = { status: newStatus };
        }

        
        await context.store.put('opportunity_statuses', lastStatuses);
        await context.store.put('lastFetchEpochMs', Date.now());

        return newEvents;
    },

    async test(context) {
        const opportunities = await getUpdatedOpportunities(context.auth, 0, context.propsValue.pipeline_id);
        return opportunities.slice(-5).reverse();
    },
});