import { createAction, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const findAds = createAction({
  name: 'findAds',
  displayName: 'Find Ads',
  description: 'Search and filter ads by various criteria including text search, dates, platforms, and categories. Returns structured response with metadata and ad data.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search text for ad name or description. Leave empty to search all ads with filters only.',
      required: false,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date (inclusive). Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'End date (inclusive). Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Order of results: newest (default), oldest, longest_running, or most_relevant',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Newest', value: 'newest' },
          { label: 'Oldest', value: 'oldest' },
          { label: 'Longest Running', value: 'longest_running' },
          { label: 'Most Relevant', value: 'most_relevant' },
        ],
      },
    }),
    live: Property.StaticDropdown({
      displayName: 'Live Status',
      description: 'Filter ads by live status. true means currently active ads, false means inactive ads.',
      required: false,
      options: {
        disabled: false,
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
          { label: 'Video', value: 'video' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'Image', value: 'image' },
          { label: 'DCO', value: 'dco' },
          { label: 'DPA', value: 'dpa' },
          { label: 'Multi Images', value: 'multi_images' },
          { label: 'Multi Videos', value: 'multi_videos' },
          { label: 'Multi Medias', value: 'multi_medias' },
          { label: 'Event', value: 'event' },
          { label: 'Text', value: 'text' },
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
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination. Use the cursor value from the previous response.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Pagination limit (default 10, max 250). Controls the number of ads returned per request.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const values = propsValue as Record<string, any>;
    const queryParams: Record<string, string> = {};

    // Add optional parameters if provided
    if (values['query']) {
      queryParams['query'] = String(values['query']);
    }
    if (values['start_date']) {
      queryParams['start_date'] = String(values['start_date']);
    }
    if (values['end_date']) {
      queryParams['end_date'] = String(values['end_date']);
    }
    if (values['order']) {
      queryParams['order'] = String(values['order']);
    }
    if (values['live']) {
      queryParams['live'] = String(values['live'] === 'true');
    }

    // Handle array parameters - repeat parameter name for each value
    if (values['display_format'] && values['display_format'].length > 0) {
      (queryParams as any).display_format = values['display_format'];
    }
    if (values['publisher_platform'] && values['publisher_platform'].length > 0) {
      (queryParams as any).publisher_platform = values['publisher_platform'];
    }
    if (values['niches'] && values['niches'].length > 0) {
      (queryParams as any).niches = values['niches'];
    }
    if (values['market_target'] && values['market_target'].length > 0) {
      (queryParams as any).market_target = values['market_target'];
    }
    if (values['languages'] && values['languages'].length > 0) {
      (queryParams as any).languages = values['languages'];
    }

    if (values['cursor']) {
      queryParams['cursor'] = String(values['cursor']);
    }
    if (values['limit']) {
      queryParams['limit'] = String(values['limit']);
    }

    const response = await foreplayCoApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/api/discovery/ads',
      queryParams,
    });

    const responseBody = response.body;

    // Check if the response is successful
    if (responseBody.metadata && responseBody.metadata.success === true) {
      // Return the structured response with both metadata and data
      return {
        success: true,
        metadata: responseBody.metadata,
        data: responseBody.data,
        // Also include top-level fields for easy access
        ads: responseBody.data,
        statusCode: responseBody.metadata.status_code,
        message: responseBody.metadata.message
      };
    } else {
      // Handle error responses
      return {
        success: false,
        metadata: responseBody.metadata,
        error: responseBody.error,
        data: responseBody.data || null,
        statusCode: responseBody.metadata?.status_code || response.status,
        message: responseBody.metadata?.message || 'Request failed'
      };
    }
  },
});
