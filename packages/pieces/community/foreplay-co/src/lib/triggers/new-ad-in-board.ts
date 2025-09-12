import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from "@activepieces/pieces-common";

const polling: Polling<string, Record<string, any>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { board_id } = propsValue;

    console.log(`[New Ad in Board Polling] Fetching ads for board: ${board_id}, lastFetch: ${new Date(lastFetchEpochMS || 0).toISOString()}`);

    const queryParams: Record<string, string> = {
      board_id: board_id,
      limit: String(250), // Max limit to get more ads
      order: 'newest'
    };

    // Add optional filters if provided
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
      resourceUri: '/api/board/ads',
      queryParams,
    });

    const responseBody = response.body;

    if (!responseBody.metadata || !responseBody.metadata.success) {
      console.log(`[New Ad in Board Polling] API call failed:`, responseBody);
      return [];
    }

    const ads = responseBody.data || [];
    console.log(`[New Ad in Board Polling] Found ${ads.length} ads for board ${board_id}`);

    return ads.map((ad: any) => ({
      epochMilliSeconds: new Date(ad.created_at).getTime(),
      data: ad,
    }));
  }
};

export const newAdInBoard = createTrigger({
  name: 'newAdInBoard',
  displayName: 'New Ad in Board',
  description: 'Triggers when a new ad is added to a specific board that the user has access to.',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: "ad_789",
    board_id: "board_456",
    brand_id: "brand_456",
    title: "New Campaign Ad",
    description: "Latest marketing campaign",
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
      description: 'The board ID to monitor for new ads. User must have access to this board.',
      required: true,
    }),
    polling_interval: Property.Number({
      displayName: 'Polling Interval (minutes)',
      description: 'How often to check for new ads (in minutes).',
      required: false,
      defaultValue: 5,
    }),
    live: Property.StaticDropdown({
      displayName: 'Live Status',
      description: 'Filter ads by live status. true means currently active ads, false means inactive ads.',
      required: false,
      options: {
        options: [
          { label: 'Active Only', value: 'true' },
          { label: 'Inactive Only', value: 'false' },
        ],
      },
    }),
    display_format: Property.MultiSelectDropdown({
      displayName: 'Display Format',
      description: 'Filter by one or more display formats',
      required: false,
      refreshers: [],
      options: async () => ({
        options: [
          { label: 'Carousel', value: 'carousel' },
          { label: 'DCO', value: 'dco' },
          { label: 'DPA', value: 'dpa' },
          { label: 'Event', value: 'event' },
          { label: 'Image', value: 'image' },
          { label: 'Video', value: 'video' },
        ],
      }),
    }),
    publisher_platform: Property.MultiSelectDropdown({
      displayName: 'Publisher Platform',
      description: 'Filter by one or more publisher platforms',
      required: false,
      refreshers: [],
      options: async () => ({
        options: [
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'Audience Network', value: 'audience_network' },
          { label: 'Messenger', value: 'messenger' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Threads', value: 'threads' },
        ],
      }),
    }),
    niches: Property.MultiSelectDropdown({
      displayName: 'Niches',
      description: 'Filter by one or more niches',
      required: false,
      refreshers: [],
      options: async () => ({
        options: [
          { label: 'Accessories', value: 'accessories' },
          { label: 'App/Software', value: 'app/software' },
          { label: 'Beauty', value: 'beauty' },
          { label: 'Business/Professional', value: 'business/professional' },
          { label: 'Education', value: 'education' },
          { label: 'Entertainment', value: 'entertainment' },
          { label: 'Fashion', value: 'fashion' },
          { label: 'Finance', value: 'finance' },
          { label: 'Food', value: 'food' },
          { label: 'Health', value: 'health' },
          { label: 'Home', value: 'home' },
          { label: 'Pets', value: 'pets' },
          { label: 'Sports', value: 'sports' },
          { label: 'Technology', value: 'technology' },
          { label: 'Travel', value: 'travel' },
          { label: 'Automotive', value: 'automotive' },
          { label: 'Other', value: 'other' },
        ],
      }),
    }),
    market_target: Property.MultiSelectDropdown({
      displayName: 'Market Target',
      description: 'Filter by market target',
      required: false,
      refreshers: [],
      options: async () => ({
        options: [
          { label: 'B2B (Business-to-Business)', value: 'b2b' },
          { label: 'B2C (Business-to-Consumer)', value: 'b2c' },
        ],
      }),
    }),
    languages: Property.MultiSelectDropdown({
      displayName: 'Languages',
      description: 'Filter by languages. Accepts various language formats.',
      required: false,
      refreshers: [],
      options: async () => ({
        options: [
          { label: 'English', value: 'english' },
          { label: 'French', value: 'french' },
          { label: 'German', value: 'german' },
          { label: 'Italian', value: 'italian' },
          { label: 'Dutch/Flemish', value: 'dutch, flemish' },
          { label: 'Spanish', value: 'spanish' },
          { label: 'Portuguese', value: 'portuguese' },
          { label: 'Romanian', value: 'romanian' },
          { label: 'Russian', value: 'russian' },
          { label: 'Chinese', value: 'chinese' },
          { label: 'Japanese', value: 'japanese' },
          { label: 'Korean', value: 'korean' },
          { label: 'Arabic', value: 'arabic' },
          { label: 'Hindi', value: 'hindi' },
        ],
      }),
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
      board_id: context.propsValue.board_id,
      brand_id: item.data.brand_id,
      title: item.data.title || item.data.name,
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