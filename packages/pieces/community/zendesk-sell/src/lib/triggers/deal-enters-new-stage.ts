import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, Polling, pollingHelper, DedupeStrategy } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';
import { stageIdDropdown } from '../common/props';

const polling: Polling<string, { stage_id: number }> = {
    strategy: DedupeStrategy.POLLING_STORE,
    items: async ({ auth, propsValue, store }) => {
        const dealsResponse = await httpClient.sendRequest<{
            items: {
                data: {
                    id: number;
                    stage_id: number;
                    updated_at: string;
                }
            }[]
        }> ({
            method: HttpMethod.GET,
            url: `https://api.getbase.com/v2/deals`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth as string,
            },
            queryParams: {
                sort_by: 'updated_at:desc',
            }
        });

        const lastStages = await store.get<Record<number, number>>('deal_stages') ?? {};
        const newStages: Record<number, number> = {};

        const triggeredDeals = [];

        for (const deal of dealsResponse.body.items) {
            const dealData = deal.data;
            const oldStage = lastStages[dealData.id];
            const newStage = dealData.stage_id;
            newStages[dealData.id] = newStage;

            if (oldStage !== newStage && newStage === propsValue.stage_id) {
                triggeredDeals.push({
                    id: dealData.id + '-' + dealData.updated_at,
                    data: dealData
                });
            }
        }

        await store.put('deal_stages', newStages);

        return triggeredDeals;
    }
};

export const dealEntersNewStage = createTrigger({
    auth: zendeskSellAuth,
    name: 'deal_enters_new_stage',
    displayName: 'Deal Enters New Stage',
    description: 'Triggers when a deal enters a new stage.',
    props: {
        stage_id: stageIdDropdown
    },
    type: TriggerStrategy.POLLING,
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    run: async (context) => {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    test: async (context) => {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    sampleData: {}
});
