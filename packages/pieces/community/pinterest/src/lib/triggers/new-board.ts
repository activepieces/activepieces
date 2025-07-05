
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<PiecePropValueSchema<typeof pinterestAuth>, Record<string, any>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        let bookmark: string | undefined = undefined;
        let boards: any[] = [];
        do {
            const params = bookmark ? `?bookmark=${encodeURIComponent(bookmark)}` : '';
            const response = await makeRequest(auth as string, HttpMethod.GET, `/boards${params}`);
            const items = response.items || [];
            boards = boards.concat(items);
            bookmark = response.bookmark;
            if (lastFetchEpochMS && items.length > 0) {
                const hasNew = items.some((item: any) => dayjs(item.created_at).valueOf() > lastFetchEpochMS);
                if (!hasNew) break;
            }
        } while (bookmark);
        if (lastFetchEpochMS) {
            boards = boards.filter((item: any) => dayjs(item.created_at).valueOf() > lastFetchEpochMS);
        }
        return boards.map((item) => ({
            epochMilliSeconds: dayjs(item.created_at).valueOf(),
            data: item,
        }));
    }
};

export const newBoard = createTrigger({
    auth: pinterestAuth,
    name: 'newBoard',
    displayName: 'New Board',
    description: 'Fires when a new board is created in the account',
    props: {},
    sampleData: {},
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test<PiecePropValueSchema<typeof pinterestAuth>, Record<string, any>>(polling, context as any);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable<PiecePropValueSchema<typeof pinterestAuth>, Record<string, any>>(polling, { store, auth, propsValue });
    },
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable<PiecePropValueSchema<typeof pinterestAuth>, Record<string, any>>(polling, { store, auth, propsValue });
    },
    async run(context) {
        return await pollingHelper.poll<PiecePropValueSchema<typeof pinterestAuth>, Record<string, any>>(polling, context as any);
    },
});