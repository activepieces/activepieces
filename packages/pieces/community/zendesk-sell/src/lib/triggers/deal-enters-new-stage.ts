import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
    StaticPropsValue,
} from '@activepieces/pieces-framework';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi, zendeskSellCommon } from '../common';


const props = {
    pipeline_id: zendeskSellCommon.pipeline(true),
    stage_id: zendeskSellCommon.stage(true),
};


interface Deal {
    id: number;
    stage_id: number;
    updated_at: string;
    [key: string]: unknown;
}


const polling: Polling<ZendeskSellAuth, StaticPropsValue<typeof props>> = {

    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth, store, propsValue }) => {
        const targetStageId = propsValue.stage_id;
        if (!targetStageId) return []; 
        
        const response = await callZendeskApi<{ items: { data: Deal }[] }>(
            HttpMethod.GET,
            'v2/deals?sort_by=updated_at:desc&per_page=100', 
            auth
        );

        const deals = response.body?.items.map(item => item.data) || [];
        const dealsInNewStage = [];

        for (const deal of deals) {
            const storedStageId = await store.get<number>(`deal_${deal.id}`);
            
            if (deal.stage_id === targetStageId && storedStageId !== targetStageId) {
                dealsInNewStage.push({
                    id: `${deal.id}-${deal.updated_at}`,
                    data: deal,
                });
            }
            

            await store.put(`deal_${deal.id}`, deal.stage_id);
        }

        return dealsInNewStage;
    },
};

export const dealEntersNewStage = createTrigger({
    auth: zendeskSellAuth,
    name: 'deal_enters_new_stage',
    displayName: 'Deal Enters New Stage',
    description: 'Fires when a deal transitions into a specified pipeline stage.',
    props: props, 
    sampleData: {
        "id": 21730067,
        "name": "Website Redesign Project",
        "value": 25000,
        "stage_id": 12345,
        "updated_at": "2025-10-17T14:30:00Z",
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