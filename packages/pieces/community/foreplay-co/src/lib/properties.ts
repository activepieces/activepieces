import { Property } from "@activepieces/pieces-framework";

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

const brandOrderOptions = () => ({
  options: [
    { label: 'Most Ranked', value: 'most_ranked' },
    { label: 'Least Ranked', value: 'least_ranked' },
  ],
});

// Action Properties
export const findAds = () => ({
  query: Property.ShortText({
    displayName: 'Search Query',
    description: 'Search text for ad name or description. Leave empty to search all ads with filters only.',
    required: true,
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
    options: orderOptions(),
  }),
  live: Property.StaticDropdown({
    displayName: 'Live Status',
    description: 'Filter ads by live status. true means currently active ads, false means inactive ads.',
    required: false,
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by one or more display formats',
    required: false,
    refreshers: [],
    options: displayFormatOptions,
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by one or more publisher platforms',
    required: false,
    refreshers: [],
    options: publisherPlatformOptions,
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by one or more niches',
    required: false,
    refreshers: [],
    options: nicheOptions,
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by market target',
    required: false,
    refreshers: [],
    options: marketTargetOptions,
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by languages. Accepts various language formats.',
    required: false,
    refreshers: [],
    options: languageOptions,
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
});

export const getAdById = () => ({
  ad_id: Property.ShortText({
    displayName: 'Ad ID',
    description: 'The unique identifier of the ad to retrieve',
    required: true,
  }),
});

export const getAdsByPage = () => ({
  page_id: Property.ShortText({
    displayName: 'Page ID',
    description: 'Facebook page ID to search for. This should be the numeric ID of the Facebook page.',
    required: true,
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
    options: orderOptions(),
  }),
  live: Property.StaticDropdown({
    displayName: 'Live Status',
    description: 'Filter ads by live status. true means currently active ads, false means inactive ads.',
    required: false,
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by one or more display formats',
    required: false,
    refreshers: [],
    options: displayFormatOptions,
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by one or more publisher platforms',
    required: false,
    refreshers: [],
    options: publisherPlatformOptions,
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by one or more niches',
    required: false,
    refreshers: [],
    options: nicheOptions,
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by market target',
    required: false,
    refreshers: [],
    options: marketTargetOptions,
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by languages. Accepts various language formats.',
    required: false,
    refreshers: [],
    options: languageOptions,
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
});

export const findBrands = () => ({
  domain: Property.ShortText({
    displayName: 'Name',
    description: 'Name to search for. Can be a full name(e.g., "example") or just the part (e.g., "examp").',
    required: true,
  }),
  limit: Property.Number({
    displayName: 'Limit',
    description: 'Pagination limit (default 10, max 10). Controls the number of brands returned per request.',
    required: false,
    defaultValue: 10,
  }),
  order: Property.StaticDropdown({
    displayName: 'Order',
    description: 'Order of results: most_ranked (default) or least_ranked. Sorts brands by relevance ranking.',
    required: false,
    options: brandOrderOptions(),
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
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by one or more display formats',
    required: false,
    refreshers: [],
    options: displayFormatOptions,
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by one or more publisher platforms',
    required: false,
    refreshers: [],
    options: publisherPlatformOptions,
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by one or more niches',
    required: false,
    refreshers: [],
    options: nicheOptions,
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by market target',
    required: false,
    refreshers: [],
    options: marketTargetOptions,
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by languages. Accepts various language formats.',
    required: false,
    refreshers: [],
    options: languageOptions,
  }),
});

export const newAdInSpyder = () => ({
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
  live: Property.StaticDropdown({
    displayName: 'Live Status',
    description: 'Filter ads by live status. true means currently active ads, false means inactive ads.',
    required: false,
    options: liveStatusOptions(),
  }),
  display_format: Property.MultiSelectDropdown({
    displayName: 'Display Format',
    description: 'Filter by one or more display formats',
    required: false,
    refreshers: [],
    options: displayFormatOptions,
  }),
  publisher_platform: Property.MultiSelectDropdown({
    displayName: 'Publisher Platform',
    description: 'Filter by one or more publisher platforms',
    required: false,
    refreshers: [],
    options: publisherPlatformOptions,
  }),
  niches: Property.MultiSelectDropdown({
    displayName: 'Niches',
    description: 'Filter by one or more niches',
    required: false,
    refreshers: [],
    options: nicheOptions,
  }),
  market_target: Property.MultiSelectDropdown({
    displayName: 'Market Target',
    description: 'Filter by market target',
    required: false,
    refreshers: [],
    options: marketTargetOptions,
  }),
  languages: Property.MultiSelectDropdown({
    displayName: 'Languages',
    description: 'Filter by languages. Accepts various language formats.',
    required: false,
    refreshers: [],
    options: languageOptions,
  }),
});

export const newSwipefileAd = () => ({
  polling_interval: Property.Number({
    displayName: 'Polling Interval (minutes)',
    description: 'How often to check for new ads (in minutes).',
    required: false,
    defaultValue: 5,
  }),
});
