
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
  limit?: number;
  platform?: string;
}

// Define interface for ad objects
interface ForeplayAd {
  id: string;
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

// Define interface for API response
interface SwipefileAdsResponse {
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
    const { limit, platform } = propsValue;

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    if (platform) {
      queryParams.append('platform', platform);
    }

    // Get ads from Swipefile API
    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/swipefile/ads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    ) as SwipefileAdsResponse;

    // Extract ads from response
    const ads = response.ads || [];

    // Filter by lastFetchEpochMS if available
    const newAds = lastFetchEpochMS
      ? ads.filter((ad: ForeplayAd) => {
          const createdAt = dayjs(
            ad.created_at || ad.createdAt || ad.date
          ).valueOf();
          return createdAt > lastFetchEpochMS;
        })
      : ads;

    // Map to the expected format
    return newAds.map((ad: ForeplayAd) => ({
      epochMilliSeconds: dayjs(
        ad.created_at || ad.createdAt || ad.date
      ).valueOf(),
      data: ad,
    }));
  },
};

export const newSwipefileAd = createTrigger({
  auth: ForeplayAuth,
  name: 'newSwipefileAd',
  displayName: 'New Swipefile Ad',
  description: 'Triggers when a new ad is added to your swipefile.',
  props: {
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of ads to return',
      required: false,
      defaultValue: 50,
    }),
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'Filter by specific platform (optional)',
      required: false,
      options: {
        options: [
          { label: 'All Platforms', value: '' },
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Twitter', value: 'twitter' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'Google', value: 'google' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'ad_12345',
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