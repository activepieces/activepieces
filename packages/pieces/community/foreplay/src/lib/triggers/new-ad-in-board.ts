
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

interface Props {
    boardId: string;
    limit?: number;
}

interface ForeplayAd {
    id: string;
    boardId?: string;
    created_at?: string;
    createdAt?: string;
    date?: string;
    platform?: string;
    headline?: string;
    adCopy?: string;
    imageUrl?: string;
    landingPage?: string;
    [key: string]: string | number | boolean | object | undefined;
}

interface BoardAdsResponse {
    ads: ForeplayAd[];
    count?: number;
    total?: number;
    page?: number;
    pageSize?: number;
    [key: string]: ForeplayAd[] | number | string | boolean | object | undefined;
}

const polling: Polling<PiecePropValueSchema<typeof ForeplayAuth>, Props> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { boardId, limit } = propsValue;

        const queryParams = new URLSearchParams();
        queryParams.append('boardId', boardId);

        if (limit) {
            queryParams.append('limit', limit.toString());
        }

        const response = await makeRequest(
            auth,
            HttpMethod.GET,
            `/board/ads?${queryParams.toString()}`
        ) as BoardAdsResponse;

        const ads = response.ads || [];

        const newAds = lastFetchEpochMS
            ? ads.filter((ad: ForeplayAd) => {
                const createdAt = dayjs(
                    ad.created_at || ad.createdAt || ad.date
                ).valueOf();
                return createdAt > lastFetchEpochMS;
            })
            : ads;

        return newAds.map((ad: ForeplayAd) => ({
            epochMilliSeconds: dayjs(
                ad.created_at || ad.createdAt || ad.date
            ).valueOf(),
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
        boardId: Property.ShortText({
            displayName: 'Board ID',
            description: 'The ID of the board to monitor for new ads',
            required: true,
        }),
        limit: Property.Number({
            displayName: 'Max Results',
            description: 'Maximum number of ads to return',
            required: false,
            defaultValue: 50,
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