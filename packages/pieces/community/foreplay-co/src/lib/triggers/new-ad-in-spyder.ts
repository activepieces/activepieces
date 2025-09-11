import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

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

  async onEnable(context) {
    // Initialize storage for tracking seen ad IDs
    const seenAds = context.store.get('seenAds') || [];
    await context.store.put('seenAds', seenAds);
  },

  async onDisable(context) {
    // Clean up if needed
    await context.store.delete('seenAds');
  },

  async run(context) {
    const brandId = context.propsValue['brand_id'];
    const pollingInterval = context.propsValue['polling_interval'] || 5;

    try {
      // Get previously seen ad IDs
      const seenAds = context.store.get('seenAds') || [];

      // Fetch current ads for the brand
      const response = await foreplayCoApiCall({
        apiKey: context.auth as string,
        method: HttpMethod.GET,
        resourceUri: '/api/spyder/brand/ads',
        queryParams: {
          brand_id: brandId,
          limit: 100, // Get a reasonable number to check for new ads
          order: 'newest'
        },
      });

      const responseBody = response.body;

      if (!responseBody.metadata || !responseBody.metadata.success) {
        return [];
      }

      const currentAds = responseBody.data || [];
      const currentAdIds = currentAds.map((ad: any) => ad.id);

      // Find new ads that haven't been seen before
      const newAds = currentAds.filter((ad: any) => !seenAds.includes(ad.id));

      // Update the seen ads list with all current ad IDs
      await context.store.put('seenAds', currentAdIds);

      // Return new ads as trigger events
      return newAds.map((ad: any) => ({
        id: ad.id,
        brand_id: ad.brand_id,
        title: ad.title,
        description: ad.description,
        live: ad.live,
        display_format: ad.display_format,
        publisher_platform: ad.publisher_platform,
        niches: ad.niches,
        market_target: ad.market_target,
        languages: ad.languages,
        created_at: ad.created_at,
        updated_at: ad.updated_at,
        // Include metadata for reference
        metadata: responseBody.metadata
      }));

    } catch (error) {
      console.error('Error polling for new ads:', error);
      return [];
    }
  },

  async test(context) {
    const brandId = context.propsValue['brand_id'];

    try {
      const response = await foreplayCoApiCall({
        apiKey: context.auth as string,
        method: HttpMethod.GET,
        resourceUri: '/api/spyder/brand/ads',
        queryParams: {
          brand_id: brandId,
          limit: 5,
          order: 'newest'
        },
      });

      const responseBody = response.body;

      if (!responseBody.metadata || !responseBody.metadata.success) {
        return [];
      }

      const ads = responseBody.data || [];
      return ads.slice(0, 1).map((ad: any) => ({
        id: ad.id,
        brand_id: ad.brand_id,
        title: ad.title,
        description: ad.description,
        live: ad.live,
        display_format: ad.display_format,
        publisher_platform: ad.publisher_platform,
        niches: ad.niches,
        market_target: ad.market_target,
        languages: ad.languages,
        created_at: ad.created_at,
        updated_at: ad.updated_at,
        metadata: responseBody.metadata
      }));

    } catch (error) {
      console.error('Error testing trigger:', error);
      return [];
    }
  }
});
