import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { foreplayAuth } from '../common/auth';
import { foreplayCommon } from '../common/props';

export const newAdInSpyder = createTrigger({
    auth: foreplayAuth,
    name: 'new_ad_in_spyder',
    displayName: 'New Ad in Spyder',
    description: 'Triggers when a new ad is added to a tracked brand in Spyder.',
    props: {
        brand_id: foreplayCommon.spyderBrand_id(),
    },
    sampleData: {
        "id": "ad_123456789",
        "brand_id": "brand_987654321",
        "title": "Sample Summer Sale Ad",
        "live": true,
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const ads = await fetchLatestAds(context.auth.apiKey, context.propsValue.brand_id as string);
        await context.store.put('lastFetchedAdIds', ads.map(ad => ad.id));
    },

    async onDisable(context) {
        await context.store.delete('lastFetchedAdIds');
    },

    async run(context) {
        const lastFetchedAdIds = (await context.store.get<string[]>('lastFetchedAdIds')) ?? [];
        
        const latestAds = await fetchLatestAds(context.auth.apiKey, context.propsValue.brand_id as string);
        
        const newAdIds = latestAds.map(ad => ad.id);
        
        const newAds = latestAds.filter(ad => !lastFetchedAdIds.includes(ad.id));

        if (newAds.length > 0) {
            await context.store.put('lastFetchedAdIds', newAdIds);
        }

        return newAds;
    },

    async test(context) {
        const ads = await fetchLatestAds(context.auth.apiKey, context.propsValue.brand_id as string, 1);
        return ads;
    }
});

const fetchLatestAds = async (apiKey: string, brand_id: string, limit = 20): Promise<{id: string}[]> => {
    const response = await httpClient.sendRequest<{ data: {id: string}[] }>({
        method: HttpMethod.GET,
        url: `https://public.api.foreplay.co/api/spyder/brand/ads`,
        queryParams: {
            brand_id,
            order: 'newest',
            limit: String(limit),
        },
        headers: {
            'Authorization': apiKey,
        }
    });
    return response.body.data || [];
}