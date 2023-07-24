import { PiecePropValueSchema, createTrigger } from '@activepieces/pieces-framework';
import { TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

import { common } from '../common';

import dayjs from 'dayjs';
import { zohoAuth } from '../..';

const polling: Polling<PiecePropValueSchema<typeof zohoAuth>, {}> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const currentValues = await common.getInvoices(auth, {
            createdTime: dayjs('2023-07-22T17:12:14+0300').format('YYYY-MM-DD')
        }) ?? [];
        const items = (currentValues as any[]).map((item: { created_time: string }) => ({
            epochMilliSeconds: dayjs(item.created_time).valueOf(),
            data: item
        }));
        return items;
    }
};

export const newInvoice = createTrigger({
    auth: zohoAuth,
    name: 'new_invoice',
    displayName: 'New Invoice',
    description: 'Trigger when a new invoice is received.',
    props: {},
    type: TriggerStrategy.POLLING,
    onEnable: async (context) => {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
    },
    onDisable: async (context) => {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        })
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
