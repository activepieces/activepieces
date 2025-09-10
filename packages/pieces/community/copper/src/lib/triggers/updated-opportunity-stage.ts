import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copperAuth } from '../common/auth';
import { copperProps } from '../common/props';

// Helper to fetch opportunities with recent stage changes
async function getStageChangedOpportunities(auth: PiecePropValueSchema<typeof copperAuth>, lastFetchSeconds: number, pipeline_id?: string) {
    const body: Record<string, unknown> = {
        page_size: 200,
        sort_by: "date_modified", // No sort_by for stage_change_date, so we use date_modified
        sort_direction: "asc",
        minimum_stage_change_date: lastFetchSeconds,
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

export const updatedOpportunityStage = createTrigger({
    name: 'updated_opportunity_stage',
    auth: copperAuth,
    displayName: 'Updated Opportunity Stage',
    description: 'Fires when an opportunity advances to a new stage.',
    props: {
        pipeline_id: copperProps.optionalPipelineId,
        pipeline_stage_id: copperProps.optionalPipelineStageId,
    },
    type: TriggerStrategy.POLLING,
    sampleData: { /* Sample data from previous Updated Opportunity trigger */ },

    async onEnable(context) {
        await context.store.put('lastFetchEpochMs', Date.now());

        const opportunities = await getStageChangedOpportunities(context.auth, 0, context.propsValue.pipeline_id);
        const stages: Record<string, { stage: number }> = {};
        for (const opp of opportunities) {
            stages[`opp_${opp.id}`] = { stage: opp.pipeline_stage_id };
        }
        await context.store.put('opportunity_stages', stages);
    },

    async onDisable(context) { 
        // No action needed
    },

    async run(context) {
        const lastFetchEpochMs = (await context.store.get<number>('lastFetchEpochMs')) ?? 0;
        const lastStages = (await context.store.get<Record<string, { stage: number }>>('opportunity_stages')) ?? {};
        
        const opportunities = await getStageChangedOpportunities(context.auth, Math.floor(lastFetchEpochMs / 1000), context.propsValue.pipeline_id);
        const newEvents = [];

        for (const opp of opportunities) {
            const storedState = lastStages[`opp_${opp.id}`];
            const newStage = opp.pipeline_stage_id;

            if (storedState && storedState.stage !== newStage) {
                if (context.propsValue.pipeline_stage_id === undefined || context.propsValue.pipeline_stage_id === newStage) {
                    newEvents.push(opp);
                }
            }
            lastStages[`opp_${opp.id}`] = { stage: newStage };
        }

        await context.store.put('opportunity_stages', lastStages);
        await context.store.put('lastFetchEpochMs', Date.now());

        return newEvents;
    },

    async test(context) {
        const opportunities = await getStageChangedOpportunities(context.auth, 0, context.propsValue.pipeline_id);
        return opportunities.slice(-5).reverse();
    },
});