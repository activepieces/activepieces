import {
    createTrigger,
    TriggerStrategy,
    PiecePropValueSchema,
    AppConnectionValueForAuthProperty
} from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../common/auth';
import { zendeskSellCommon } from '../common/props';
import { callZendeskApi } from '../common/client';

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


type TriggerPropsValue = {
    stage_id: number | undefined;
    pipeline_id: number | undefined;
};


type PreviousDealStagesMap = Record<string, number>;

const polling: Polling<AppConnectionValueForAuthProperty<typeof zendeskSellAuth>, TriggerPropsValue> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const response = await callZendeskApi<{ items: ZendeskDealItem[] }>(
			HttpMethod.GET,
			'v2/deals',
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
        // For test, we need to handle the case where stage_id might be undefined
        const testDeals = await pollingHelper.test(polling, context) as ZendeskDeal[];
        const matchingDeal = testDeals.find(deal => deal.stage_id === context.propsValue.stage_id);
        return [matchingDeal ?? {}];
    },

    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
        // Initialize custom state for stage tracking
        await context.store.put<PreviousDealStagesMap>(PREVIOUS_DEAL_STAGES_STORE_KEY, {});
        console.log(`Initialized store for dealEntersStage`);
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
        await context.store.delete(PREVIOUS_DEAL_STAGES_STORE_KEY);
        console.log(`Cleaned up store for dealEntersStage`);
    },


    async run(context) {
        const { propsValue, store } = context;
        const targetStageId = propsValue.stage_id;
        const previousDealStages = await store.get<PreviousDealStagesMap>(PREVIOUS_DEAL_STAGES_STORE_KEY) ?? {};

        if (!targetStageId) {
            throw new Error('Stage ID is required for deal enters stage trigger');
        }

        console.log(`Polling deals for stage transitions to stage ${targetStageId}`);

        // Get all deals using polling helper
        const deals = await pollingHelper.poll(polling, context) as ZendeskDeal[];
        const dealsEnteringTargetStage: ZendeskDeal[] = [];
        const currentDealStages: PreviousDealStagesMap = { ...previousDealStages };

        for (const deal of deals) {
            const dealIdStr = deal.id.toString();
            const previousStageId = previousDealStages[dealIdStr];
            const currentStageId = deal.stage_id;

            if (currentStageId === targetStageId && previousStageId !== undefined && previousStageId !== targetStageId) {
                console.log(`Deal ${deal.id} entered stage ${targetStageId} (from ${previousStageId})`);
                dealsEnteringTargetStage.push(deal);
            }
            currentDealStages[dealIdStr] = currentStageId;
        }

        await store.put(PREVIOUS_DEAL_STAGES_STORE_KEY, currentDealStages);

        console.log(`Found ${dealsEnteringTargetStage.length} deals entering stage ${targetStageId}`);
        return dealsEnteringTargetStage;
    },
});