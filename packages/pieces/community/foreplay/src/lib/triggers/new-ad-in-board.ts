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
        queryParams.append('limit', limit?.toString() || '250');
        queryParams.append('order', 'newest');

        if (propsValue.live) {
            queryParams.append('live', propsValue.live);
        }
        if (propsValue.display_format?.length) {
            propsValue.display_format.forEach((df) =>
                queryParams.append('display_format', df)
            );
        }
        if (propsValue.publisher_platform?.length) {
            propsValue.publisher_platform.forEach((pp) =>
                queryParams.append('publisher_platform', pp)
            );
        }

        const response = (await makeRequest(
            auth,
            HttpMethod.GET,
            `/board/ads?board_id=${boardId}&${queryParams.toString()}`

        )) as BoardAdsResponse;

       
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
                    { label: 'All', value: '' },
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
                    { label: 'Audience Network', value: 'audience_network' },
                    { label: 'Messenger', value: 'messenger' },
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
