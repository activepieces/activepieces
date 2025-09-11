import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const newAdInBoard = createTrigger({
  name: 'newAdInBoard',
  displayName: 'New Ad in Board',
  description: 'Triggers when a new ad is added to any brand within a user board.',
  type: TriggerStrategy.POLLING,
  sampleData: {
    board_id: "board_123",
    brand_id: "brand_456",
    ad_id: "ad_789",
    ad_title: "New Campaign Ad",
    ad_description: "Latest marketing campaign",
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
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The board ID to monitor for new ads in any associated brands.',
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
    // Initialize storage for tracking seen ad IDs per brand
    const seenAdsByBrand = context.store.get('seenAdsByBrand') || {};
    await context.store.put('seenAdsByBrand', seenAdsByBrand);
  },

  async onDisable(context) {
    // Clean up if needed
    await context.store.delete('seenAdsByBrand');
  },

  async run(context) {
    const boardId = context.propsValue['board_id'];
    const pollingInterval = context.propsValue['polling_interval'] || 5;

    try {
      // Get previously seen ad IDs organized by brand
      const seenAdsByBrand = context.store.get('seenAdsByBrand') || {};

      // First, get all brands associated with the board
      const brandsResponse = await foreplayCoApiCall({
        apiKey: context.auth as string,
        method: HttpMethod.GET,
        resourceUri: '/api/board/brands',
        queryParams: {
          board_id: boardId,
          limit: 50, // Get a reasonable number of brands
        },
      });

      const brandsResponseBody = brandsResponse.body;

      if (!brandsResponseBody.metadata || !brandsResponseBody.metadata.success) {
        return [];
      }

      const brands = brandsResponseBody.data || [];
      const newAds = [];

      // For each brand in the board, check for new ads
      for (const brand of brands) {
        try {
          // Get ads for this brand
          const adsResponse = await foreplayCoApiCall({
            apiKey: context.auth as string,
            method: HttpMethod.GET,
            resourceUri: '/api/spyder/brand/ads',
            queryParams: {
              brand_id: brand.id,
              limit: 20, // Check recent ads for each brand
              order: 'newest'
            },
          });

          const adsResponseBody = adsResponse.body;

          if (!adsResponseBody.metadata || !adsResponseBody.metadata.success) {
            continue; // Skip this brand if there's an error
          }

          const currentAds = adsResponseBody.data || [];
          const currentAdIds = currentAds.map((ad: any) => ad.id);

          // Get previously seen ads for this brand
          const seenAdsForBrand = seenAdsByBrand[brand.id] || [];

          // Find new ads that haven't been seen before
          const newAdsForBrand = currentAds.filter((ad: any) => !seenAdsForBrand.includes(ad.id));

          // Add new ads to the result with board and brand context
          newAdsForBrand.forEach((ad: any) => {
            newAds.push({
              board_id: boardId,
              brand_id: brand.id,
              brand_name: brand.name,
              ad_id: ad.id,
              ad_title: ad.title || ad.name,
              ad_description: ad.description,
              live: ad.live,
              display_format: ad.display_format,
              publisher_platform: ad.publisher_platform,
              niches: ad.niches,
              market_target: ad.market_target,
              languages: ad.languages,
              created_at: ad.created_at,
              updated_at: ad.updated_at,
              metadata: adsResponseBody.metadata
            });
          });

          // Update seen ads for this brand
          seenAdsByBrand[brand.id] = currentAdIds;

        } catch (brandError) {
          console.error(`Error checking ads for brand ${brand.id}:`, brandError);
          // Continue with other brands even if one fails
        }
      }

      // Save updated seen ads by brand
      await context.store.put('seenAdsByBrand', seenAdsByBrand);

      // Return new ads as trigger events
      return newAds;

    } catch (error) {
      console.error('Error polling for new ads in board:', error);
      return [];
    }
  },

  async test(context) {
    const boardId = context.propsValue['board_id'];

    try {
      // Get brands for the board
      const brandsResponse = await foreplayCoApiCall({
        apiKey: context.auth as string,
        method: HttpMethod.GET,
        resourceUri: '/api/board/brands',
        queryParams: {
          board_id: boardId,
          limit: 5,
        },
      });

      const brandsResponseBody = brandsResponse.body;

      if (!brandsResponseBody.metadata || !brandsResponseBody.metadata.success) {
        return [];
      }

      const brands = brandsResponseBody.data || [];

      if (brands.length === 0) {
        return [];
      }

      // Get a sample ad from the first brand
      const firstBrand = brands[0];
      const adsResponse = await foreplayCoApiCall({
        apiKey: context.auth as string,
        method: HttpMethod.GET,
        resourceUri: '/api/spyder/brand/ads',
        queryParams: {
          brand_id: firstBrand.id,
          limit: 1,
          order: 'newest'
        },
      });

      const adsResponseBody = adsResponse.body;

      if (!adsResponseBody.metadata || !adsResponseBody.metadata.success) {
        return [];
      }

      const ads = adsResponseBody.data || [];
      return ads.slice(0, 1).map((ad: any) => ({
        board_id: boardId,
        brand_id: firstBrand.id,
        brand_name: firstBrand.name,
        ad_id: ad.id,
        ad_title: ad.title || ad.name,
        ad_description: ad.description,
        live: ad.live,
        display_format: ad.display_format,
        publisher_platform: ad.publisher_platform,
        niches: ad.niches,
        market_target: ad.market_target,
        languages: ad.languages,
        created_at: ad.created_at,
        updated_at: ad.updated_at,
        metadata: adsResponseBody.metadata
      }));

    } catch (error) {
      console.error('Error testing board trigger:', error);
      return [];
    }
  }
});
