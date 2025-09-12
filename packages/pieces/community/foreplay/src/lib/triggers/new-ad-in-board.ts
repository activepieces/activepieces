import {
    createTrigger,
    TriggerStrategy,
    Property,
    PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import { ForeplayAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import dayjs from 'dayjs';
import { BoardIdDropdown } from '../common/dropdown';

interface Props {
    boardId: string | undefined;
    limit?: number;
    live?: string;
    display_format?: string[];
    publisher_platform?: string[];
    niches?: string[];
    market_target?: string[];
    languages?: string[];
}

interface ForeplayAd {
    id: string;
    boardId?: string;
    brand_id?: string;
    title?: string;
    description?: string;
    live?: boolean;
    display_format?: string;
    publisher_platform?: string[];
    niches?: string[];
    market_target?: string;
    languages?: string[];
    created_at?: string;
    createdAt?: string;
    date?: string;
    updated_at?: string;
    [key: string]: string | number | boolean | object | undefined;
}

interface BoardAdsResponse {
    data: ForeplayAd[];
    metadata?: { success: boolean;[key: string]: any };
}

const polling: Polling<PiecePropValueSchema<typeof ForeplayAuth>, Props> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        if (!propsValue.boardId) {
            throw new Error("Board ID is required but not provided");
        }
        const boardId = propsValue.boardId;
        const limit = propsValue.limit;


        const queryParams = new URLSearchParams();
        queryParams.append('board_id', boardId);
        queryParams.append('limit', limit?.toString() || '250');
        queryParams.append('order', 'newest');

        if (propsValue.live !== undefined) {
            queryParams.append('live', propsValue.live === 'true' ? 'true' : 'false');
        }
        if (propsValue.display_format?.length) {
            queryParams.append('display_format', propsValue.display_format.join(','));
        }
        if (propsValue.publisher_platform?.length) {
            queryParams.append('publisher_platform', propsValue.publisher_platform.join(','));
        }
        if (propsValue.niches?.length) {
            queryParams.append('niches', propsValue.niches.join(','));
        }
        if (propsValue.market_target?.length) {
            queryParams.append('market_target', propsValue.market_target.join(','));
        }
        if (propsValue.languages?.length) {
            queryParams.append('languages', propsValue.languages.join(','));
        }

        const response = await makeRequest(
            auth,
            HttpMethod.GET,
            `/api/board/ads?${queryParams.toString()}`
        ) as BoardAdsResponse;

        if (!response.metadata?.success) {
            console.log(`[New Ad in Board] API call failed:`, response);
            return [];
        }

        const ads = response.data || [];
        const newAds = lastFetchEpochMS
            ? ads.filter((ad) => {
                const createdAt = dayjs(ad.created_at || ad.createdAt || ad.date).valueOf();
                return createdAt > lastFetchEpochMS;
            })
            : ads;

        return newAds.map((ad) => ({
            epochMilliSeconds: dayjs(ad.created_at || ad.createdAt || ad.date).valueOf(),
            data: ad,
        }));
    },
};

export const newAdInBoard = createTrigger({
    auth: ForeplayAuth,
    name: 'newAdInBoard',
    displayName: 'New Ad in Board',
    description: 'Triggers when new ads are added to a specified board.',
    props: {
        boardId: BoardIdDropdown,
        limit: Property.Number({
            displayName: 'Max Results',
            description: 'Maximum number of ads to return',
            required: false,
            defaultValue: 50,
        }),
        live: Property.StaticDropdown({
            displayName: 'Live Status',
            description: 'Filter ads by live status',
            required: false,
            options: {
                options: [
                    { label: 'Active Only', value: 'true' },
                    { label: 'Inactive Only', value: 'false' },
                ],
            },
        }),
        display_format: Property.MultiSelectDropdown({
            displayName: 'Display Format',
            description: 'Filter by display format',
            required: false,
            refreshers: [],
            options: async () => ({
                options: [
                    { label: 'Carousel', value: 'carousel' },
                    { label: 'Image', value: 'image' },
                    { label: 'Video', value: 'video' },
                    { label: 'DPA', value: 'dpa' },
                    { label: 'Event', value: 'event' },
                ],
            }),
        }),
        publisher_platform: Property.MultiSelectDropdown({
            displayName: 'Publisher Platform',
            description: 'Filter by publisher platform',
            required: false,
            refreshers: [],
            options: async () => ({
                options: [
                    { label: 'Facebook', value: 'facebook' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'TikTok', value: 'tiktok' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'Google', value: 'google' },
                ],
            }),
        }),
        niches: Property.MultiSelectDropdown({
            displayName: 'Niches',
            description: 'Filter by niches',
            required: false,
            refreshers: [],
            options: async () => ({
                options: [
                    { label: 'Accessories', value: 'accessories' },
                    { label: 'App/Software', value: 'app/software' },
                    { label: 'Beauty', value: 'beauty' },
                    { label: 'Business/Professional', value: 'business/professional' },
                    { label: 'Education', value: 'education' },
                    { label: 'Entertainment', value: 'entertainment' },
                    { label: 'Fashion', value: 'fashion' },
                    { label: 'Finance', value: 'finance' },
                    { label: 'Food', value: 'food' },
                    { label: 'Health', value: 'health' },
                    { label: 'Home', value: 'home' },
                    { label: 'Pets', value: 'pets' },
                    { label: 'Sports', value: 'sports' },
                    { label: 'Technology', value: 'technology' },
                    { label: 'Travel', value: 'travel' },
                    { label: 'Automotive', value: 'automotive' },
                    { label: 'Other', value: 'other' },
                ],
            }),
        }),
        market_target: Property.MultiSelectDropdown({
            displayName: 'Market Target',
            description: 'Filter by market target',
            required: false,
            refreshers: [],
            options: async () => ({
                options: [
                    { label: 'B2B', value: 'b2b' },
                    { label: 'B2C', value: 'b2c' },
                ],
            }),
        }),
        languages: Property.MultiSelectDropdown({
            displayName: 'Languages',
            description: 'Filter by ad languages',
            required: false,
            refreshers: [],
            options: async () => ({
                options: [
                    { label: 'English', value: 'english' },
                    { label: 'French', value: 'french' },
                    { label: 'German', value: 'german' },
                    { label: 'Italian', value: 'italian' },
                    { label: 'Dutch/Flemish', value: 'dutch, flemish' },
                    { label: 'Spanish', value: 'spanish' },
                    { label: 'Portuguese', value: 'portuguese' },
                    { label: 'Romanian', value: 'romanian' },
                    { label: 'Russian', value: 'russian' },
                    { label: 'Chinese', value: 'chinese' },
                    { label: 'Japanese', value: 'japanese' },
                    { label: 'Korean', value: 'korean' },
                    { label: 'Arabic', value: 'arabic' },
                    { label: 'Hindi', value: 'hindi' },
                ],
            }),
        }),
    },
    sampleData: {
        id: 'ad_12345',
        boardId: 'board_987',
        platform: 'facebook',
        createdAt: '2025-08-15T10:30:00Z',
        headline: 'Summer Sale - 50% Off Everything!',
        adCopy: 'Limited time offer on our summer collection. Shop now!',
        imageUrl: 'https://example.com/ads/summer-sale.jpg',
        landingPage: 'https://example.com/summer-sale',
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});
