import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from "@activepieces/pieces-common";

const polling: Polling<string, {}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    console.log(`[New Ad in User Brands Polling] Fetching user brands, lastFetch: ${new Date(lastFetchEpochMS || 0).toISOString()}`);

    // Get all boards the user has access to
    const boardsResponse = await foreplayCoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/api/boards',
      queryParams: {
        limit: String(50),
      },
    });

    const boardsResponseBody = boardsResponse.body;

    if (!boardsResponseBody.metadata || !boardsResponseBody.metadata.success) {
      console.log(`[New Ad in User Brands Polling] Boards API call failed:`, boardsResponseBody);
      return [];
    }

    const boards = boardsResponseBody.data || [];
    console.log(`[New Ad in User Brands Polling] Found ${boards.length} boards`);

    const allNewAds: any[] = [];

    // For each board, discover brands and get their ads
    for (const board of boards) {
      try {
        console.log(`[New Ad in User Brands Polling] Processing board: ${board.id}`);

        // Discover brands through discovery endpoint
        const discoveryResponse = await foreplayCoApiCall({
          apiKey: auth,
          method: HttpMethod.GET,
          resourceUri: '/api/discovery/ads',
          queryParams: {
            limit: String(20),
            order: 'newest'
          },
        });

        const discoveryResponseBody = discoveryResponse.body;

        if (!discoveryResponseBody.metadata || !discoveryResponseBody.metadata.success) {
          console.log(`[New Ad in User Brands Polling] Discovery API call failed:`, discoveryResponseBody);
          continue;
        }

        const discoveryAds = discoveryResponseBody.data || [];
        console.log(`[New Ad in User Brands Polling] Found ${discoveryAds.length} ads in discovery`);

        // Group ads by brand_id
        const adsByBrand: Record<string, any[]> = {};
        discoveryAds.forEach((ad: any) => {
          if (ad.brand_id) {
            if (!adsByBrand[ad.brand_id]) {
              adsByBrand[ad.brand_id] = [];
            }
            adsByBrand[ad.brand_id].push(ad);
          }
        });

        console.log(`[New Ad in User Brands Polling] Found ${Object.keys(adsByBrand).length} brands with ads`);

        // Process each brand we discovered
        for (const [brandId, brandAds] of Object.entries(adsByBrand)) {
          try {
            console.log(`[New Ad in User Brands Polling] Processing brand: ${brandId}`);

            // Get current ads for this brand using spyder
            const adsResponse = await foreplayCoApiCall({
              apiKey: auth,
              method: HttpMethod.GET,
              resourceUri: '/api/spyder/brand/ads',
              queryParams: {
                brand_id: brandId,
                limit: String(20),
                order: 'newest'
              },
            });

            const adsResponseBody = adsResponse.body;

            if (!adsResponseBody.metadata || !adsResponseBody.metadata.success) {
              console.log(`[New Ad in User Brands Polling] Spyder API call failed for brand ${brandId}:`, adsResponseBody);
              continue;
            }

            const currentAds = adsResponseBody.data || [];
            console.log(`[New Ad in User Brands Polling] Found ${currentAds.length} ads for brand ${brandId}`);

            // Add all ads with their timestamps for deduplication
            currentAds.forEach((ad: any) => {
              allNewAds.push({
                epochMilliSeconds: new Date(ad.created_at).getTime(),
                data: ad,
              });
            });

          } catch (brandError) {
            console.error(`Error checking ads for brand ${brandId}:`, brandError);
          }
        }

      } catch (boardError) {
        console.error(`Error processing board ${board.id}:`, boardError);
      }
    }

    console.log(`[New Ad in User Brands Polling] Returning ${allNewAds.length} total ads for deduplication`);
    return allNewAds;
  }
};

export const newAdInBoard = createTrigger({
  name: 'newAdInBoard',
  displayName: 'New Ad in User Brands',
  description: 'Triggers when a new ad is added to any brand that the user has access to.',
  type: TriggerStrategy.POLLING,
  sampleData: {
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
      brand_id: item.data.brand_id,
      ad_id: item.data.id,
      ad_title: item.data.title || item.data.name,
      ad_description: item.data.description,
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