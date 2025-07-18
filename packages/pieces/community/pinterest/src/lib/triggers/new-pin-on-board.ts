
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<PiecePropValueSchema<typeof pinterestAuth>, Record<string, any>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ propsValue, auth, lastFetchEpochMS }) => {
        const board_id = propsValue['board_id'];
        let bookmark: string | undefined = undefined;
        let pins: any[] = [];
        do {
            const params = bookmark ? `?bookmark=${encodeURIComponent(bookmark)}` : '';
            const response = await makeRequest(auth.access_token as string, HttpMethod.GET, `/boards/${board_id}/pins${params}`);
            const items = response.items || [];
            pins = pins.concat(items);
            bookmark = response.bookmark;
            if (lastFetchEpochMS && items.length > 0) {
                const hasNew = items.some((item: any) => dayjs(item.created_at).valueOf() > lastFetchEpochMS);
                if (!hasNew) break;
            }
        } while (bookmark);
        if (lastFetchEpochMS) {
            pins = pins.filter((item: any) => dayjs(item.created_at).valueOf() > lastFetchEpochMS);
        }
        return pins.map((item) => ({
            epochMilliSeconds: dayjs(item.created_at).valueOf(),
            data: item,
        }));
    }
};

export const newPinOnBoard = createTrigger({
    auth: pinterestAuth,
    name: 'newPinOnBoard',
    displayName: 'New Pin on Board',
    description: 'Fires when a new Pin is added to a specific board.',
    props: {
        board_id: Property.ShortText({
            displayName: 'Board ID',
            required: true,
            description: 'The ID of the board to watch for new pins.'
        })
    },
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