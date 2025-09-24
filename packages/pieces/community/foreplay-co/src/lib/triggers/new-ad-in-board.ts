import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod, Polling, DedupeStrategy, pollingHelper } from "@activepieces/pieces-common";
import { newAdInBoard as newAdInBoardProperties } from "../properties";
import { newAdInBoardSchema } from "../schemas";

const getBoardsDropdown = async (auth: string) => {
  try {
    const response = await foreplayCoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/api/boards',
    });

    const responseBody = response.body;

    if (responseBody.metadata && responseBody.metadata.success === true && responseBody.data) {
      return {
        options: responseBody.data.map((board: any) => ({
          label: board.name || board.title || `Board ${board.id}`,
          value: board.id
        }))
      };
    }

    return { options: [] };
  } catch (error) {
    console.error('Error fetching boards for dropdown:', error);
    return { options: [] };
  }
};

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
  description: 'Triggers when a new ad is added to the selected board.',
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

  props: newAdInBoardProperties(),

  async test(context) {
    // Validate props using Zod schema
    const validation = newAdInBoardSchema.safeParse(context.propsValue);
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
    const validation = newAdInBoardSchema.safeParse(context.propsValue);
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