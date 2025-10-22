import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { foreplayCoApiCall } from '../common';
import {
  HttpMethod,
  Polling,
  DedupeStrategy,
  pollingHelper,
} from '@activepieces/pieces-common';
import { newAdInSpyder as newAdInSpyderProperties } from '../properties';
import { newAdInSpyderSchema } from '../schemas';

const polling: Polling<string, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const { brand_id } = propsValue;

    // Build query parameters with user's filter preferences
    const queryParams = new URLSearchParams();
    queryParams.append('brand_id', brand_id);
    queryParams.append('limit', String(50)); // Reasonable default for polling
    queryParams.append('order', 'newest');

    // Add optional filters if provided
    if (propsValue['live']) {
      queryParams.append('live', String(propsValue['live']));
    }
    if (
      propsValue['display_format'] &&
      propsValue['display_format'].length > 0
    ) {
      propsValue['display_format'].forEach((format: unknown) => {
        queryParams.append('display_format', String(format));
      });
    }
    if (
      propsValue['publisher_platform'] &&
      propsValue['publisher_platform'].length > 0
    ) {
      propsValue['publisher_platform'].forEach((platform: unknown) => {
        queryParams.append('publisher_platform', String(platform));
      });
    }
    if (propsValue['niches'] && propsValue['niches'].length > 0) {
      propsValue['niches'].forEach((niche: unknown) => {
        queryParams.append('niches', String(niche));
      });
    }
    if (propsValue['market_target'] && propsValue['market_target'].length > 0) {
      propsValue['market_target'].forEach((target: unknown) => {
        queryParams.append('market_target', String(target));
      });
    }
    if (propsValue['languages'] && propsValue['languages'].length > 0) {
      propsValue['languages'].forEach((language: unknown) => {
        queryParams.append('languages', String(language));
      });
    }

    const queryString = queryParams.toString();
    const fullUrl = `/api/spyder/brand/ads?${queryString}`;

    const response = await foreplayCoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: fullUrl,
    });

    const responseBody = response.body;

    if (!responseBody.metadata || !responseBody.metadata.success) {
      return [];
    }

    const ads = responseBody.data || [];

    return ads.map((ad: any) => ({
      epochMilliSeconds: new Date(ad.created_at).getTime(),
      data: ad,
    }));
  },
};

export const newAdInSpyder = createTrigger({
  name: 'newAdInSpyder',
  displayName: 'New Ad in Spyder',
  description: 'Triggers when new ads are added for a brand in Spyder.',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'ad_123456789',
    brand_id: 'brand_987654321',
    title: 'New Summer Sale Ad',
    description: 'A great summer sale ad.',
    live: true,
    display_format: 'video',
    publisher_platform: ['facebook'],
    niches: ['fashion'],
    market_target: 'b2c',
    languages: ['en'],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },

  props: newAdInSpyderProperties(),

  async test(context) {
    // Validate props using Zod schema
    const validation = newAdInSpyderSchema.safeParse(context.propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    return await pollingHelper.test(polling, {
      auth: context.auth as string,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth as string,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      propsValue: context.propsValue,
      auth: context.auth as string,
    });
  },

  async run(context) {
    // Validate props using Zod schema
    const validation = newAdInSpyderSchema.safeParse(context.propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const result = await pollingHelper.poll(polling, {
      auth: context.auth as string,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });

    // Return clean ad data for automation workflows
    return result.map((item: any) => item.data);
  },
});
