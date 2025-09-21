import { Property } from '@activepieces/pieces-framework';
import { foreplayCoApiCall } from './common';
import { HttpMethod } from '@activepieces/pieces-common';

// Common dropdown options (keeping existing functionality)
const orderOptions = () => ({
  options: [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Longest Running', value: 'longest_running' },
    { label: 'Most Relevant', value: 'most_relevant' },
  ],
});

const liveStatusOptions = () => ({
  options: [
    { label: 'Active Only', value: 'true' },
    { label: 'Inactive Only', value: 'false' },
  ],
});

const displayFormatOptions = () => ({
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
});

const publisherPlatformOptions = () => ({
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
});

const nicheOptions = () => ({
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
});

const marketTargetOptions = () => ({
  options: [
    { label: 'B2B (Business-to-Business)', value: 'b2b' },
    { label: 'B2C (Business-to-Consumer)', value: 'b2c' },
  ],
});

const languageOptions = () => ({
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
});

// Action Properties
export const findAds = () => ({
  query: Property.ShortText({
    displayName: 'Search Query',
    description:
      'Search text for ad name or description. Leave empty to search all ads with filters only.',
    required: false,
  }),
  start_date: Property.DateTime({
    displayName: 'Start Date',
    description:
      'Start date (inclusive). Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS',
    required: false,
  }),
  end_date: Property.DateTime({
    displayName: 'End Date',
    description:
      'End date (inclusive). Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS',
    required: false,
  }),
  order: Property.StaticDropdown({
    displayName: 'Order',
    description:
      'Order of results: newest (default), oldest, longest_running, or most_relevant',
    required: false,
    options: orderOptions(),
  }),
  live: Property.StaticDropdown({
    displayName: 'Live Status',
    description:
      'Filter ads by live status. true means currently active ads, false means inactive ads.',
    required: false,
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by one or more display formats',
    required: false,
    refreshers: [],
    options: async () => displayFormatOptions(),
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by one or more publisher platforms',
    required: false,
    refreshers: [],
    options: async () => publisherPlatformOptions(),
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by one or more niches',
    required: false,
    refreshers: [],
    options: async () => nicheOptions(),
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by market target',
    required: false,
    refreshers: [],
    options: async () => marketTargetOptions(),
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by languages. Accepts various language formats.',
    required: false,
    refreshers: [],
    options: async () => languageOptions(),
  }),
  cursor: Property.ShortText({
    displayName: 'Cursor',
    description:
      'Cursor for pagination. Use the cursor value from the previous response.',
    required: false,
  }),
  limit: Property.Number({
    displayName: 'Limit',
    description:
      'Pagination limit (default 10, max 250). Controls the number of ads returned per request.',
    required: false,
    defaultValue: 10,
  }),
});

export const getAdById = () => ({
  ad_id: Property.ShortText({
    displayName: 'Ad ID',
    description:
      'The unique identifier of the ad (e.g., "ad_1234567890"). You can find this ID from other Foreplay actions or the platform.',
    required: true,
  }),
});

export const getAdsByPage = () => ({
  page_id: Property.ShortText({
    displayName: 'Page ID',
    description:
      'The numeric Facebook page ID (e.g., "123456789"). You can find this in your Facebook page settings or from other Foreplay actions.',
    required: true,
  }),
  start_date: Property.DateTime({
    displayName: 'Start Date',
    description:
      'Start date (inclusive). Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS',
    required: false,
  }),
  end_date: Property.DateTime({
    displayName: 'End Date',
    description:
      'End date (inclusive). Format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS',
    required: false,
  }),
  order: Property.StaticDropdown({
    displayName: 'Order',
    description:
      'Order of results: newest (default), oldest, longest_running, or most_relevant',
    required: false,
    options: orderOptions(),
  }),
  live: Property.StaticDropdown({
    displayName: 'Live Status',
    description:
      'Filter ads by live status. true means currently active ads, false means inactive ads.',
    required: false,
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by one or more display formats',
    required: false,
    refreshers: [],
    options: async () => displayFormatOptions(),
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by one or more publisher platforms',
    required: false,
    refreshers: [],
    options: async () => publisherPlatformOptions(),
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by one or more niches',
    required: false,
    refreshers: [],
    options: async () => nicheOptions(),
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by market target',
    required: false,
    refreshers: [],
    options: async () => marketTargetOptions(),
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by languages. Accepts various language formats.',
    required: false,
    refreshers: [],
    options: async () => languageOptions(),
  }),
  cursor: Property.ShortText({
    displayName: 'Cursor',
    description:
      'Cursor for pagination. Use the cursor value from the previous response.',
    required: false,
  }),
  limit: Property.Number({
    displayName: 'Limit',
    description:
      'Pagination limit (default 10, max 250). Controls the number of ads returned per request.',
    required: false,
    defaultValue: 10,
  }),
});

export const findBrands = () => ({
  query: Property.ShortText({
    displayName: 'Brand Name',
    description:
      'Brand name to search for (e.g., "Nike", "Apple"). Supports fuzzy matching for partial names.',
    required: true,
  }),
  limit: Property.Number({
    displayName: 'Limit',
    description: 'Number of brands to return (max 10).',
    required: false,
    defaultValue: 10,
  }),
});

export const findBoards = () => ({
  offset: Property.Number({
    displayName: 'Offset',
    description: 'The offset for pagination (default 0).',
    required: false,
    defaultValue: 0,
  }),
  limit: Property.Number({
    displayName: 'Limit',
    description: 'The limit for pagination (default 10, max 10).',
    required: false,
    defaultValue: 10,
  }),
});

// Trigger Properties
export const newAdInBoard = () => ({
  board_id: Property.Dropdown({
    displayName: 'Board',
    description: 'Select the board to monitor for new ads.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      try {
        const response = await foreplayCoApiCall({
          apiKey: auth as string,
          method: HttpMethod.GET,
          resourceUri: '/api/boards',
        });

        const responseBody = response.body;
        if (responseBody.metadata && responseBody.metadata.success === true) {
          const boards = responseBody.data || [];
          return {
            options: boards.map((board: any) => ({
              label: board.name || board.title || `Board ${board.id}`,
              value: board.id,
            })),
          };
        } else {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load boards',
          };
        }
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading boards',
        };
      }
    },
  }),
  polling_interval: Property.Number({
    displayName: 'Polling Interval (minutes)',
    description: 'How often to check for new ads (in minutes).',
    required: false,
    defaultValue: 5,
  }),
  live: Property.StaticDropdown({
    displayName: 'Live Status',
    description:
      'Filter ads by live status. true means currently active ads, false means inactive ads.',
    required: false,
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by one or more display formats',
    required: false,
    refreshers: [],
    options: async () => displayFormatOptions(),
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by one or more publisher platforms',
    required: false,
    refreshers: [],
    options: async () => publisherPlatformOptions(),
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by one or more niches',
    required: false,
    refreshers: [],
    options: async () => nicheOptions(),
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by market target',
    required: false,
    refreshers: [],
    options: async () => marketTargetOptions(),
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by languages. Accepts various language formats.',
    required: false,
    refreshers: [],
    options: async () => languageOptions(),
  }),
});

export const newAdInSpyder = () => ({
  brand_id: Property.Dropdown({
    displayName: 'Brand',
    description: 'Select the brand to monitor for new ads.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account first',
        };
      }

      try {
        const response = await foreplayCoApiCall({
          apiKey: auth as string,
          method: HttpMethod.GET,
          resourceUri: '/api/spyder/brands',
        });

        const responseBody = response.body;
        if (responseBody.metadata && responseBody.metadata.success === true) {
          const brands = responseBody.data || [];
          return {
            options: brands.map((brand: any) => ({
              label: brand.name || brand.id,
              value: brand.id,
            })),
          };
        } else {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load brands',
          };
        }
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Error loading brands',
        };
      }
    },
  }),
  polling_interval: Property.Number({
    displayName: 'Polling Interval (minutes)',
    description: 'How often to check for new ads (in minutes).',
    required: false,
    defaultValue: 5,
  }),
  live: Property.StaticDropdown({
    displayName: 'Live Status',
    description:
      'Filter ads by live status. true means currently active ads, false means inactive ads.',
    required: false,
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by one or more display formats',
    required: false,
    refreshers: [],
    options: async () => displayFormatOptions(),
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by one or more publisher platforms',
    required: false,
    refreshers: [],
    options: async () => publisherPlatformOptions(),
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by one or more niches',
    required: false,
    refreshers: [],
    options: async () => nicheOptions(),
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by market target',
    required: false,
    refreshers: [],
    options: async () => marketTargetOptions(),
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by languages. Accepts various language formats.',
    required: false,
    refreshers: [],
    options: async () => languageOptions(),
  }),
});

export const newSwipefileAd = () => ({
  polling_interval: Property.Number({
    displayName: 'Polling Interval (minutes)',
    description: 'How often to check for new ads (in minutes).',
    required: false,
    defaultValue: 5,
  }),
  start_date: Property.DateTime({
    displayName: 'Start Date',
    description: 'Filter ads published after this date.',
    required: false,
  }),
  end_date: Property.DateTime({
    displayName: 'End Date',
    description: 'Filter ads published before this date.',
    required: false,
  }),
  live: Property.StaticDropdown({
    displayName: 'Live Status',
    description: 'Filter by ad status (active/inactive).',
    required: false,
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by ad format (video, image, carousel, etc.).',
    required: false,
    refreshers: [],
    options: async () => displayFormatOptions(),
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by platform (Facebook, Instagram, etc.).',
    required: false,
    refreshers: [],
    options: async () => publisherPlatformOptions(),
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by industry/category.',
    required: false,
    refreshers: [],
    options: async () => nicheOptions(),
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by target audience (B2B, B2C).',
    required: false,
    refreshers: [],
    options: async () => marketTargetOptions(),
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by ad language.',
    required: false,
    refreshers: [],
    options: async () => languageOptions(),
  }),
});
