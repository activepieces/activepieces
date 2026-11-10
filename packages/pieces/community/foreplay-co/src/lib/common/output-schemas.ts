import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const creditFields: OutputSchemaField[] = [
  { key: 'creditCost', label: 'Credits Used', format: 'number', description: 'Foreplay credits this call consumed (X-Credit-Cost).' },
  { key: 'creditsRemaining', label: 'Credits Remaining', format: 'number' },
];

const adFields: OutputSchemaField[] = [
  { key: 'id', label: 'Foreplay Ad ID', description: 'Internal Foreplay ID (not accepted by Get Ad or List Ad Duplicates; use the Public Ad ID for those).' },
  { key: 'adId', label: 'Public Ad ID', description: 'Ad library ID from the platform. Use it with Get Ad, Get Ad by ID and List Ad Duplicates.' },
  { key: 'name', label: 'Name' },
  { key: 'brandId', label: 'Brand ID' },
  { key: 'description', label: 'Ad Copy' },
  { key: 'headline', label: 'Headline' },
  { key: 'ctaTitle', label: 'CTA Text' },
  { key: 'ctaType', label: 'CTA Type' },
  { key: 'linkUrl', label: 'Landing Page', format: 'url' },
  { key: 'displayFormat', label: 'Display Format' },
  { key: 'type', label: 'Type' },
  { key: 'publisherPlatforms', label: 'Platforms' },
  { key: 'niches', label: 'Niches' },
  { key: 'languages', label: 'Languages' },
  { key: 'marketTarget', label: 'Market Target' },
  { key: 'productCategory', label: 'Product Category' },
  { key: 'categories', label: 'Categories' },
  { key: 'live', label: 'Live', format: 'boolean' },
  { key: 'startedRunning', label: 'Started Running', format: 'datetime' },
  { key: 'runningDuration', label: 'Running Duration', dynamicKey: true },
  { key: 'thumbnail', label: 'Thumbnail', format: 'url' },
  { key: 'image', label: 'Image', format: 'url' },
  { key: 'video', label: 'Video', format: 'url' },
  { key: 'videoDuration', label: 'Video Duration (s)', format: 'number' },
  { key: 'avatar', label: 'Brand Avatar', format: 'url' },
  { key: 'fullTranscription', label: 'Transcription' },
  { key: 'cardCount', label: 'Card Count', format: 'number' },
  {
    key: 'cards',
    label: 'Carousel Cards',
    labelKey: 'title',
    listItems: [
      { key: 'title', label: 'Title' },
      { key: 'headline', label: 'Headline' },
      { key: 'description', label: 'Description' },
      { key: 'image', label: 'Image', format: 'url' },
      { key: 'video', label: 'Video', format: 'url' },
      { key: 'ctaText', label: 'CTA Text' },
    ],
  },
  { key: 'emotionalDrivers', label: 'Emotional Drivers', dynamicKey: true },
  { key: 'persona', label: 'Persona', dynamicKey: true },
  { key: 'foreplayUrl', label: 'Open in Foreplay', format: 'url' },
];

const brandFields: OutputSchemaField[] = [
  { key: 'id', label: 'Brand ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'niches', label: 'Niches' },
  { key: 'url', label: 'Website', format: 'url' },
  { key: 'websites', label: 'Websites' },
  { key: 'avatar', label: 'Avatar', format: 'url' },
  { key: 'pageId', label: 'Facebook Page ID', description: 'Use it with List Page Ads and the Spyder ranking actions.' },
  { key: 'verificationStatus', label: 'Verification Status' },
  { key: 'adsCount', label: 'Ads Indexed', format: 'number' },
  { key: 'activeAdsCount', label: 'Active Ads', format: 'number' },
];

const boardFields: OutputSchemaField[] = [
  { key: 'id', label: 'Board ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created', format: 'datetime' },
];

const rankedAdFields: OutputSchemaField[] = [
  { key: 'id', label: 'Foreplay Ad ID' },
  { key: 'adId', label: 'Public Ad ID' },
  { key: 'rank', label: 'Rank', format: 'number' },
  { key: 'previousRank', label: 'Previous Rank', format: 'number' },
  { key: 'peakRank', label: 'Peak Rank', format: 'number' },
  { key: 'daysRunning', label: 'Days Running', format: 'number' },
  { key: 'category', label: 'Category' },
  { key: 'asset', label: 'Asset', format: 'url' },
  { key: 'type', label: 'Type' },
  { key: 'ad', label: 'Ad', children: adFields },
];

function cursorPage({ itemsLabel, labelKey, items }: { itemsLabel: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'items', label: itemsLabel, labelKey, listItems: items },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextCursor', label: 'Next Cursor', description: 'Pass as cursor to get the next page; null when there is none.' },
      ...creditFields,
    ],
  };
}

function offsetPage({ itemsLabel, labelKey, items }: { itemsLabel: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'items', label: itemsLabel, labelKey, listItems: items },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextOffset', label: 'Next Offset', format: 'number', description: 'Pass as offset to get the next page; null when there is none.' },
      ...creditFields,
    ],
  };
}

function list({ itemsLabel, labelKey, items }: { itemsLabel: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'items', label: itemsLabel, labelKey, listItems: items },
      { key: 'count', label: 'Returned', format: 'number' },
      ...creditFields,
    ],
  };
}

const rawAdFields: OutputSchemaField[] = [
  { key: 'id', label: 'Foreplay Ad ID' },
  { key: 'ad_id', label: 'Public Ad ID' },
  { key: 'name', label: 'Name' },
  { key: 'brand_id', label: 'Brand ID' },
  { key: 'description', label: 'Ad Copy' },
  { key: 'headline', label: 'Headline' },
  { key: 'cta_title', label: 'CTA Text' },
  { key: 'link_url', label: 'Landing Page', format: 'url' },
  { key: 'display_format', label: 'Display Format' },
  { key: 'publisher_platform', label: 'Platforms' },
  { key: 'niches', label: 'Niches' },
  { key: 'languages', label: 'Languages' },
  { key: 'market_target', label: 'Market Target' },
  { key: 'live', label: 'Live', format: 'boolean' },
  { key: 'started_running', label: 'Started Running (epoch)', format: 'number' },
  { key: 'thumbnail', label: 'Thumbnail', format: 'url' },
  { key: 'image', label: 'Image', format: 'url' },
  { key: 'video', label: 'Video', format: 'url' },
  { key: 'video_duration', label: 'Video Duration (s)', format: 'number' },
  { key: 'full_transcription', label: 'Transcription' },
  { key: 'foreplay_url', label: 'Open in Foreplay', format: 'url' },
];

const rawBrandFields: OutputSchemaField[] = [
  { key: 'id', label: 'Brand ID' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'niches', label: 'Niches' },
  { key: 'url', label: 'Website', format: 'url' },
  { key: 'avatar', label: 'Avatar', format: 'url' },
  { key: 'ad_library_id', label: 'Facebook Page ID' },
  { key: 'ads_count', label: 'Ads Indexed', format: 'number' },
  { key: 'active_ads_count', label: 'Active Ads', format: 'number' },
];

const rawBoardFields: OutputSchemaField[] = [
  { key: 'id', label: 'Board ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'created_at', label: 'Created (epoch)', format: 'number' },
];

const legacyEventMetadataFields: OutputSchemaField[] = [
  { key: 'metadata.success', label: 'Detected', format: 'boolean' },
  { key: 'metadata.message', label: 'Detection Message' },
];

const foreplayOutputSchemas = {
  ad: { fields: [...adFields, ...creditFields] } satisfies OutputSchema,
  adEvent: { fields: adFields } satisfies OutputSchema,
  adCursorPage: cursorPage({ itemsLabel: 'Ads', labelKey: 'name', items: adFields }),
  adOffsetPage: offsetPage({ itemsLabel: 'Ads', labelKey: 'name', items: adFields }),
  adList: list({ itemsLabel: 'Ads', labelKey: 'name', items: adFields }),
  brand: { fields: [...brandFields, ...creditFields] } satisfies OutputSchema,
  brandList: list({ itemsLabel: 'Brands', labelKey: 'name', items: brandFields }),
  brandOffsetPage: offsetPage({ itemsLabel: 'Brands', labelKey: 'name', items: brandFields }),
  boardList: list({ itemsLabel: 'Boards', labelKey: 'name', items: boardFields }),
  boardOffsetPage: offsetPage({ itemsLabel: 'Boards', labelKey: 'name', items: boardFields }),
  analytics: {
    fields: [
      {
        key: 'items',
        label: 'Days',
        labelKey: 'date',
        listItems: [
          { key: 'date', label: 'Date', format: 'date' },
          { key: 'activeCount', label: 'Active Ads', format: 'number' },
          { key: 'inactiveCount', label: 'Inactive Ads', format: 'number' },
          { key: 'formats', label: 'Ads by Format', dynamicKey: true },
        ],
      },
      { key: 'count', label: 'Days Returned', format: 'number' },
      ...creditFields,
    ],
  } satisfies OutputSchema,
  topAds: {
    fields: [
      { key: 'pageId', label: 'Page ID' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'compareDaysAgo', label: 'Compared With (days ago)', format: 'number' },
      { key: 'items', label: 'Ranked Ads', labelKey: 'rank', listItems: rankedAdFields },
      { key: 'count', label: 'Returned', format: 'number' },
      ...creditFields,
    ],
  } satisfies OutputSchema,
  rankedAds: {
    fields: [
      { key: 'pageId', label: 'Page ID' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'category', label: 'Category' },
      { key: 'items', label: 'Ranked Ads', labelKey: 'rank', listItems: rankedAdFields },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextOffset', label: 'Next Offset', format: 'number' },
      { key: 'counts', label: 'Counts by Category', dynamicKey: true },
      ...creditFields,
    ],
  } satisfies OutputSchema,
  relatedPages: list({
    itemsLabel: 'Related Pages',
    labelKey: 'name',
    items: [
      { key: 'pageId', label: 'Page ID' },
      { key: 'name', label: 'Name' },
      { key: 'brandId', label: 'Brand ID' },
      { key: 'profileUrl', label: 'Profile', format: 'url' },
      { key: 'profilePicUrl', label: 'Picture', format: 'url' },
      { key: 'categories', label: 'Categories' },
      { key: 'likeCount', label: 'Likes', format: 'number' },
      { key: 'adsCount', label: 'Ads', format: 'number' },
      { key: 'liveAdsCount', label: 'Live Ads', format: 'number' },
      { key: 'firstSeenAt', label: 'First Seen', format: 'datetime' },
      { key: 'lastSeenAt', label: 'Last Seen', format: 'datetime' },
    ],
  }),
  usage: {
    fields: [
      { key: 'totalCredits', label: 'Total Credits', format: 'number' },
      { key: 'remainingCredits', label: 'Remaining Credits', format: 'number' },
      { key: 'usedCredits', label: 'Used Credits', format: 'number' },
      { key: 'periodStart', label: 'Billing Period Start', format: 'datetime' },
      { key: 'periodEnd', label: 'Billing Period End', format: 'datetime' },
      { key: 'userId', label: 'User ID' },
    ],
  } satisfies OutputSchema,
  lensReport: {
    fields: [
      { key: 'items', label: 'Rows', listItems: [
        { key: 'core_metrics', label: 'Core Metrics', dynamicKey: true },
        { key: 'actions', label: 'Actions', dynamicKey: true },
        { key: 'action_values', label: 'Action Values', dynamicKey: true },
      ] },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'total', label: 'Total Rows', format: 'number' },
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextPage', label: 'Next Page', format: 'number' },
      ...creditFields,
    ],
  } satisfies OutputSchema,
  rawAds: { itemLabel: '{name}', fields: rawAdFields } satisfies OutputSchema,
  rawAd: { fields: rawAdFields } satisfies OutputSchema,
  boardAd: { fields: [...rawAdFields, { key: 'title', label: 'Title' }, { key: 'board_id', label: 'Board ID' }, ...legacyEventMetadataFields] } satisfies OutputSchema,
  swipefileAd: { fields: [...rawAdFields, ...legacyEventMetadataFields] } satisfies OutputSchema,
  rawBrands: { itemLabel: '{name}', fields: rawBrandFields } satisfies OutputSchema,
  rawBoards: { itemLabel: '{name}', fields: rawBoardFields } satisfies OutputSchema,
};

export { foreplayOutputSchemas };
