import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, Polling, pollingHelper } from '@activepieces/pieces-common';
import { zendeskSellAuth } from '../..';

const polling: Polling<string, Record<string, never>> = {
    strategy: TriggerStrategy.POLLING,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const response = await httpClient.sendRequest<{
            items: {
                data: {
                    id: number;
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

        const newItems = response.body.items.filter(item => new Date(item.data.updated_at).getTime() > lastFetchEpochMS);
        return newItems.map(item => ({
            id: item.data.id,
            data: item.data,
            epoch: new Date(item.data.updated_at).getTime(),
        }));
    }
};

export const updatedDeal = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_deal',
    displayName: 'Updated Deal',
    description: 'Triggers when a deal is updated.',
    props: {},
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
