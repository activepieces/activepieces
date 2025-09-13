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
  brandId: string;
  limit?: number;
}

const polling: Polling<PiecePropValueSchema<typeof ForeplayAuth>, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { brandId, limit } = propsValue;

    const queryParams = new URLSearchParams();
    queryParams.append('brand_id', brandId);

    if (limit) {
      queryParams.append('limit', limit.toString());
    }

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/spyder/brand/ads?${queryParams.toString()}`
    );

    const ads = response.data || [];

    const newAds = lastFetchEpochMS
      ? ads.filter((ad: any) => {
        const createdAt = dayjs(
          ad.created_at || ad.createdAt || ad.date
        ).valueOf();
        return createdAt > lastFetchEpochMS;
      })
      : ads;

    return newAds.map((ad: any) => ({
      epochMilliSeconds: dayjs(
        ad.created_at || ad.createdAt || ad.date
      ).valueOf(),
      data: ad,
    }));
  },
};

export const newAdInSpyder = createTrigger({
  auth: ForeplayAuth,
  name: 'newAdInSpyder',
  displayName: 'New Ad in Spyder',
  description: 'Triggers when new brand ads are added in the Spyder database.',
  props: {
    brandId: Property.ShortText({
      displayName: 'Brand ID',
      description: 'The ID of the brand to monitor for new ads',
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
    brand_id: 'brand_987',
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
