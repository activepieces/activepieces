import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { foreplayAuth } from '../common/auth';

export const newSwipefileAd = createTrigger({
    auth: foreplayAuth,
    name: 'new_swipefile_ad',
    displayName: 'New Swipefile Ad',
    description: 'Triggers when a new ad is added to your personal swipefile.',
    props: {
    },
    sampleData: {
        "id": "ad_123456789",
        "brand_id": "brand_987654321",
        "brand_name": "Example Brand",
        "title": "New Collection Ad",
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const ads = await fetchLatestSwipefileAds(context.auth.apiKey);
        await context.store.put('swipefile_lastFetchedAdIds', ads.map(ad => ad.id));
    },

    async onDisable(context) {
        await context.store.delete('swipefile_lastFetchedAdIds');
    },

    async run(context) {
        const lastFetchedAdIds = (await context.store.get<string[]>('swipefile_lastFetchedAdIds')) ?? [];
        const latestAds = await fetchLatestSwipefileAds(context.auth.apiKey);
        
        const newAdIds = latestAds.map(ad => ad.id);
        const newAds = latestAds.filter(ad => !lastFetchedAdIds.includes(ad.id));

        if (newAds.length > 0) {
            await context.store.put('swipefile_lastFetchedAdIds', newAdIds);
        }

        return newAds;
    },

    async test(context) {
        const ads = await fetchLatestSwipefileAds(context.auth.apiKey, 1);
        return ads;
    }
});

const fetchLatestSwipefileAds = async (apiKey: string, limit = 20): Promise<{id: string}[]> => {
    const response = await httpClient.sendRequest<{ data: {id: string}[] }>({
        method: HttpMethod.GET,
        url: `https://public.api.foreplay.co/api/swipefile/ads`,
        queryParams: {
            order: 'newest',
            limit: String(limit),
        },
        headers: {
            'Authorization': apiKey,
        }
    });
    return response.body.data || [];
}