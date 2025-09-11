import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { foreplayAuth } from '../common/auth';
import { foreplayCommon } from '../common/props';

export const newAdInBoard = createTrigger({
    auth: foreplayAuth,
    name: 'new_ad_in_board',
    displayName: 'New Ad in Board',
    description: 'Triggers when a new ad is added to a user board.',
    props: {
        board_id: foreplayCommon.board_id(),
    },
    sampleData: {
        "id": "ad_987654321",
        "brand_id": "brand_123456789",
        "title": "Sample Ad From Board",
        "live": false,
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const ads = await fetchLatestBoardAds(context.auth.apiKey, context.propsValue.board_id as string);
        await context.store.put('board_lastFetchedAdIds', ads.map(ad => ad.id));
    },

    async onDisable(context) {
        await context.store.delete('board_lastFetchedAdIds');
    },

    async run(context) {
        const lastFetchedAdIds = (await context.store.get<string[]>('board_lastFetchedAdIds')) ?? [];
        const latestAds = await fetchLatestBoardAds(context.auth.apiKey, context.propsValue.board_id as string);
        
        const newAdIds = latestAds.map(ad => ad.id);
        const newAds = latestAds.filter(ad => !lastFetchedAdIds.includes(ad.id));

        if (newAds.length > 0) {
            await context.store.put('board_lastFetchedAdIds', newAdIds);
        }

        return newAds;
    },

    async test(context) {
        const ads = await fetchLatestBoardAds(context.auth.apiKey, context.propsValue.board_id as string, 1);
        return ads;
    }
});

const fetchLatestBoardAds = async (apiKey: string, board_id: string, limit = 20): Promise<{id: string}[]> => {
    const response = await httpClient.sendRequest<{ data: {id: string}[] }>({
        method: HttpMethod.GET,
        url: `https://public.api.foreplay.co/api/board/ads`,
        queryParams: {
            board_id,
            order: 'newest',
            limit: String(limit),
        },
        headers: {
            'Authorization': apiKey,
        }
    });
    return response.body.data || [];
}