import {
    createTrigger,
    TriggerStrategy,
    Property,
    Store,
    TriggerHookContext
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth as ZendeskSellAuthValue } from '../common/auth';
import { zendeskSellCommon } from '../common/props';
import { callZendeskApi } from '../common/client';


const LAST_POLL_TIME_STORE_KEY = 'dealEntersStage_last_poll_time_v2';
const PREVIOUS_DEAL_STAGES_STORE_KEY = 'dealEntersStage_previous_stages_v2';

interface ZendeskDealItem {
    data: ZendeskDeal;
    meta: { type: string };
}
interface ZendeskDeal {
    id: number;
    name: string;
    stage_id: number;
    updated_at: string; 
}


interface TriggerPropsValue {
    stage_id: number;
    pipeline_id: number;
}


type PreviousDealStagesMap = Record<string, number>;

export const dealEntersStage = createTrigger({
    auth: zendeskSellAuth,
    name: 'deal_enters_stage',
    displayName: 'Deal Enters New Stage',
    description: 'Fires when a deal transitions into a specified pipeline stage by polling for updates.',
    props: {
        pipeline_id: zendeskSellCommon.pipeline(true),
        stage_id: zendeskSellCommon.stage(true),
    },
    sampleData: { 
        "id": 67890,
        "name": "New Big Deal",
        "value": 50000,
        "stage_id": 2, 
        "contact_id": 54321,
        "owner_id": 12345,
        "updated_at": "2025-10-18T10:30:00Z"
    },
    type: TriggerStrategy.POLLING,


    async test(context) {
        const { auth, propsValue } = context;
        const targetStageId = propsValue.stage_id;

        const response = await callZendeskApi<{ items: ZendeskDealItem[] }>(
            HttpMethod.GET,
            'v2/deals',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'updated_at:desc',
                per_page: '100', 
            }
        );

        const deals = response.body.items.map(item => item.data);
        const matchingDeal = deals.find(deal => deal.stage_id === targetStageId);

        return [matchingDeal ?? {}];
    },

    async onEnable(context) {
        await context.store.put(LAST_POLL_TIME_STORE_KEY, Math.floor(Date.now() / 1000));
        await context.store.put<PreviousDealStagesMap>(PREVIOUS_DEAL_STAGES_STORE_KEY, {});
        console.log(`Initialized store for dealEntersStage`);
    },

    async onDisable(context) {
        await context.store.delete(LAST_POLL_TIME_STORE_KEY);
        await context.store.delete(PREVIOUS_DEAL_STAGES_STORE_KEY);
        console.log(`Cleaned up store for dealEntersStage`);
    },


    async run(context) {
        const { auth, propsValue, store } = context;
        const targetStageId = propsValue.stage_id;
        const lastPollTimeSeconds = await store.get<number>(LAST_POLL_TIME_STORE_KEY) ?? 0;
        const previousDealStages = await store.get<PreviousDealStagesMap>(PREVIOUS_DEAL_STAGES_STORE_KEY) ?? {};

        console.log(`Polling deals updated after timestamp (seconds): ${lastPollTimeSeconds}`);

        const response = await callZendeskApi<{ items: ZendeskDealItem[] }>(
            HttpMethod.GET,
            'v2/deals',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'updated_at:asc',
                per_page: '100', 
            }
        );

        const deals = response.body.items.map(item => item.data);
        let maxTimestampSeconds = lastPollTimeSeconds;
        const dealsEnteringTargetStage: ZendeskDeal[] = [];
        const currentDealStages: PreviousDealStagesMap = { ...previousDealStages }; 

        for (const deal of deals) {
            const updatedAtSeconds = Math.floor(new Date(deal.updated_at).getTime() / 1000);

            if (updatedAtSeconds > lastPollTimeSeconds) {
                const dealIdStr = deal.id.toString();
                const previousStageId = previousDealStages[dealIdStr];
                const currentStageId = deal.stage_id;

                if (currentStageId === targetStageId && previousStageId !== undefined && previousStageId !== targetStageId) {
                    console.log(`Deal ${deal.id} entered stage ${targetStageId} (from ${previousStageId})`);
                    dealsEnteringTargetStage.push(deal);
                }
                 currentDealStages[dealIdStr] = currentStageId;



                if (updatedAtSeconds > maxTimestampSeconds) {
                    maxTimestampSeconds = updatedAtSeconds;
                }
            }
        }


        if (maxTimestampSeconds > lastPollTimeSeconds) {
            await store.put(LAST_POLL_TIME_STORE_KEY, maxTimestampSeconds);
            console.log(`Updated ${LAST_POLL_TIME_STORE_KEY} to: ${maxTimestampSeconds}`);
        } else {
             console.log(`No new deals found since last poll time: ${lastPollTimeSeconds}`);
        }

        await store.put(PREVIOUS_DEAL_STAGES_STORE_KEY, currentDealStages);


        console.log(`Found ${dealsEnteringTargetStage.length} deals entering stage ${targetStageId}`);
        return dealsEnteringTargetStage;
    },
});