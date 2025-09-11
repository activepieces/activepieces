import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from "@activepieces/pieces-common";

const polling: Polling<string, { brand_id: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { brand_id } = propsValue;

    console.log(`[New Ad in Spyder Polling] Fetching ads for brand: ${brand_id}, lastFetch: ${new Date(lastFetchEpochMS || 0).toISOString()}`);

    const response = await foreplayCoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/api/spyder/brand/ads',
      queryParams: {
        brand_id: brand_id,
        limit: String(100),
        order: 'newest'
      },
    });

    const responseBody = response.body;

    if (!responseBody.metadata || !responseBody.metadata.success) {
      console.log(`[New Ad in Spyder Polling] API call failed:`, responseBody);
      return [];
    }

    const ads = responseBody.data || [];
    console.log(`[New Ad in Spyder Polling] Found ${ads.length} ads for brand ${brand_id}`);

    return ads.map((ad: any) => ({
      epochMilliSeconds: new Date(ad.created_at).getTime(),
      data: ad,
    }));
  }
};

export const newAdInSpyder = createTrigger({
  name: 'newAdInSpyder',
  displayName: 'New Ad in Spyder',
  description: 'Triggers when a new brand ad is added in Spyder for a specific brand.',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: "ad_123456789",
    brand_id: "brand_987654321",
    title: "New Summer Sale Ad",
    description: "A great summer sale ad.",
    live: true,
    display_format: "video",
    publisher_platform: ["facebook"],
    niches: ["fashion"],
    market_target: "b2c",
    languages: ["en"],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z"
  },

  props: {
    brand_id: Property.ShortText({
      displayName: 'Brand ID',
      description: 'The brand ID to monitor for new ads. User must have access to this brand.',
      required: true,
    }),
    polling_interval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for new ads (in minutes).',
      required: false,
      defaultValue: 5,
    }),
  },

  async test(context) {
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
    const result = await pollingHelper.poll(polling, {
      auth: context.auth as string,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });

    // Transform the result to match our expected format
    return result.map((item: any) => ({
      id: item.data.id,
      brand_id: item.data.brand_id,
      title: item.data.title,
      description: item.data.description,
      live: item.data.live,
      display_format: item.data.display_format,
      publisher_platform: item.data.publisher_platform,
      niches: item.data.niches,
      market_target: item.data.market_target,
      languages: item.data.languages,
      created_at: item.data.created_at,
      updated_at: item.data.updated_at,
      metadata: { success: true, message: 'New ad detected' }
    }));
  }
});