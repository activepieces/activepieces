
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
        let followers: any[] = [];
        do {
            const params = bookmark ? `?bookmark=${encodeURIComponent(bookmark)}` : '';
            const response = await makeRequest(auth.access_token as string, HttpMethod.GET, `/followers${params}`);
            const items = response.items || [];
            followers = followers.concat(items);
            bookmark = response.bookmark;
            // If lastFetchEpochMS is set, stop early if all are older
            if (lastFetchEpochMS && items.length > 0) {
                const hasNew = items.some((item: any) => item.created_at && dayjs(item.created_at).valueOf() > lastFetchEpochMS);
                if (!hasNew) break;
            }
        } while (bookmark);
        // Filter by lastFetchEpochMS if available
        if (lastFetchEpochMS) {
            followers = followers.filter((item: any) => item.created_at && dayjs(item.created_at).valueOf() > lastFetchEpochMS);
        }
        return followers.map((item) => ({
            epochMilliSeconds: item.created_at ? dayjs(item.created_at).valueOf() : 0,
            data: item,
        }));
    }
};

export const newFollower = createTrigger({
    auth: pinterestAuth,
    name: 'newFollower',
    displayName: 'New Follower',
    description: 'Triggers when a user gains a new follower.',
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