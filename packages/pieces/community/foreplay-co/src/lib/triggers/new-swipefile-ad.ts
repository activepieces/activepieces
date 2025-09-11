import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const newSwipefileAd = createTrigger({
  name: 'newSwipefileAd',
  displayName: 'New Swipefile Ad',
  description: 'Triggers when a new ad is added to the user\'s swipefile collection.',
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

  props: {
    polling_interval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for new swipefile ads (in minutes).',
      required: false,
      defaultValue: 5,
    }),
  },

  async onEnable(context) {
    // Initialize storage for tracking seen swipefile ad IDs
    const seenSwipefileAds = context.store.get('seenSwipefileAds') || [];
    await context.store.put('seenSwipefileAds', seenSwipefileAds);
  },

  async onDisable(context) {
    // Clean up if needed
    await context.store.delete('seenSwipefileAds');
  },

  async run(context) {
    const pollingInterval = context.propsValue['polling_interval'] || 5;

    try {
      // Get previously seen swipefile ad IDs
      const seenSwipefileAds = context.store.get('seenSwipefileAds') || [];

      // Fetch current swipefile ads
      const response = await foreplayCoApiCall({
        apiKey: context.auth as string,
        method: HttpMethod.GET,
        resourceUri: '/api/swipefile/ads',
        queryParams: {
          limit: 100, // Get a reasonable number to check for new ads
          order: 'newest'
        },
      });

      const responseBody = response.body;

      if (!responseBody.metadata || !responseBody.metadata.success) {
        return [];
      }

      const currentSwipefileAds = responseBody.data || [];
      const currentAdIds = currentSwipefileAds.map((ad: any) => ad.id);

      // Find new ads that haven't been seen before
      const newSwipefileAds = currentSwipefileAds.filter((ad: any) => !seenSwipefileAds.includes(ad.id));

      // Update the seen ads list with all current ad IDs
      await context.store.put('seenSwipefileAds', currentAdIds);

      // Return new swipefile ads as trigger events
      return newSwipefileAds.map((ad: any) => ({
        id: ad.id,
        brand_id: ad.brand_id,
        brand_name: ad.brand_name,
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
        media_urls: ad.media_urls,
        ad_library_id: ad.ad_library_id,
        ad_library_url: ad.ad_library_url,
        // Include metadata for reference
        metadata: responseBody.metadata
      }));

    } catch (error) {
      console.error('Error polling for new swipefile ads:', error);
      return [];
    }
  },

  async test(context) {
    try {
      const response = await foreplayCoApiCall({
        apiKey: context.auth as string,
        method: HttpMethod.GET,
        resourceUri: '/api/swipefile/ads',
        queryParams: {
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
        brand_name: ad.brand_name,
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
        media_urls: ad.media_urls,
        ad_library_id: ad.ad_library_id,
        ad_library_url: ad.ad_library_url,
        metadata: responseBody.metadata
      }));

    } catch (error) {
      console.error('Error testing swipefile trigger:', error);
      return [];
    }
  }
});
