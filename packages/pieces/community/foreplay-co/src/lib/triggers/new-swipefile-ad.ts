import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from "@activepieces/pieces-common";
import { newSwipefileAd as newSwipefileAdProperties } from "../properties";
import { newSwipefileAdSchema } from "../schemas";

const polling: Polling<string, Record<string, any>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    console.log(`[New Swipefile Ad Polling] Fetching swipefile ads, lastFetch: ${new Date(lastFetchEpochMS || 0).toISOString()}`);

    const queryParams: Record<string, string> = {
      limit: String(250), // Max limit to get more ads
      order: 'newest'
    };

    // Add optional filters if provided
    if (propsValue['start_date']) {
      queryParams['start_date'] = propsValue['start_date'];
    }
    if (propsValue['end_date']) {
      queryParams['end_date'] = propsValue['end_date'];
    }
    if (propsValue['live'] !== undefined) {
      queryParams['live'] = String(propsValue['live'] === 'true');
    }
    if (propsValue['display_format'] && propsValue['display_format'].length > 0) {
      (queryParams as any).display_format = propsValue['display_format'];
    }
    if (propsValue['publisher_platform'] && propsValue['publisher_platform'].length > 0) {
      (queryParams as any).publisher_platform = propsValue['publisher_platform'];
    }
    if (propsValue['niches'] && propsValue['niches'].length > 0) {
      (queryParams as any).niches = propsValue['niches'];
    }
    if (propsValue['market_target'] && propsValue['market_target'].length > 0) {
      (queryParams as any).market_target = propsValue['market_target'];
    }
    if (propsValue['languages'] && propsValue['languages'].length > 0) {
      (queryParams as any).languages = propsValue['languages'];
    }

    const response = await foreplayCoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/api/swipefile/ads',
      queryParams,
    });

    const responseBody = response.body;

    if (!responseBody.metadata || !responseBody.metadata.success) {
      console.log(`[New Swipefile Ad Polling] API call failed:`, responseBody);
      return [];
    }

    const ads = responseBody.data || [];
    console.log(`[New Swipefile Ad Polling] Found ${ads.length} swipefile ads`);

    return ads.map((ad: any) => ({
      epochMilliSeconds: new Date(ad.created_at).getTime(),
      data: ad,
    }));
  }
};

export const newSwipefileAd = createTrigger({
  name: 'newSwipefileAd',
  displayName: 'New Swipefile Ad',
  description: 'Triggers when a new ad is added to your swipefile collection.',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: "ad_123456789",
    brand_id: "brand_987654321",
    brand_name: "Nike",
    title: "Just Do It - New Collection",
    description: "Discover our latest athletic wear collection",
    live: true,
    display_format: "video",
    publisher_platform: ["facebook"],
    niches: ["sports", "fashion"],
    market_target: "b2c",
    languages: ["en"],
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    media_urls: [
      "https://example.com/video1.mp4",
      "https://example.com/image1.jpg"
    ],
    ad_library_id: "123456789",
    ad_library_url: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&view_all_page_id=123456789"
  },

  props: newSwipefileAdProperties(),

  async test(context) {
    // Validate props using Zod schema
    const validation = newSwipefileAdSchema.safeParse(context.propsValue);
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
    const validation = newSwipefileAdSchema.safeParse(context.propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

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
      brand_name: item.data.brand_name,
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
      media_urls: item.data.media_urls,
      ad_library_id: item.data.ad_library_id,
      ad_library_url: item.data.ad_library_url,
      metadata: { success: true, message: 'New ad detected' }
    }));
  }
});