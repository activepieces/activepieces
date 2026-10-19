import { OutputSchema } from '@activepieces/pieces-framework';

// Board shape is identical across POST /boards, PATCH /boards/{id},
// GET /search/boards items and GET /boards.
const boardFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Board ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'privacy', label: 'Privacy' },
  {
    key: 'owner',
    label: 'Owner',
    children: [{ key: 'username', label: 'Username' }],
  },
  { key: 'pin_count', label: 'Pin Count', format: 'number' },
  { key: 'follower_count', label: 'Follower Count', format: 'number' },
  { key: 'collaborator_count', label: 'Collaborator Count', format: 'number' },
  { key: 'is_ads_only', label: 'Ads Only', format: 'boolean' },
  {
    key: 'media',
    label: 'Media',
    children: [
      { key: 'image_cover_url', label: 'Cover Image', format: 'image' },
      // Plain URL strings; left undescribed so it drills as a list.
      { key: 'pin_thumbnail_urls', label: 'Pin Thumbnails' },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  {
    key: 'board_pins_modified_at',
    label: 'Pins Modified At',
    format: 'datetime',
  },
];

// Pin shape is identical across POST /pins, GET /search/pins items and
// GET /boards/{id}/pins.
const pinFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Pin ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'alt_text', label: 'Alt Text' },
  { key: 'link', label: 'Destination Link', format: 'url' },
  { key: 'board_id', label: 'Board ID' },
  { key: 'board_section_id', label: 'Board Section ID' },
  {
    key: 'board_owner',
    label: 'Board Owner',
    children: [{ key: 'username', label: 'Username' }],
  },
  {
    key: 'media',
    label: 'Media',
    children: [
      { key: 'media_type', label: 'Media Type' },
      // Keyed by image size ("150x150", "600x", ...), so the keys are data.
      {
        key: 'images',
        label: 'Images',
        description:
          'Rendered image variants keyed by size, each with url, width and height.',
        dynamicKey: true,
      },
    ],
  },
  { key: 'dominant_color', label: 'Dominant Color' },
  { key: 'creative_type', label: 'Creative Type' },
  { key: 'parent_pin_id', label: 'Parent Pin ID' },
  { key: 'product_tags', label: 'Product Tags' },
  {
    key: 'pin_metrics',
    label: 'Pin Metrics',
    description:
      'Only returned when the action asks for metrics; reactions and comments are lifetime-only.',
    children: [
      {
        key: '90d',
        label: 'Last 90 Days',
        children: [
          { key: 'impression', label: 'Impressions', format: 'number' },
          { key: 'save', label: 'Saves', format: 'number' },
          { key: 'pin_click', label: 'Pin Clicks', format: 'number' },
          { key: 'outbound_click', label: 'Outbound Clicks', format: 'number' },
          { key: 'user_follow', label: 'User Follows', format: 'number' },
          { key: 'profile_visit', label: 'Profile Visits', format: 'number' },
          { key: 'last_updated', label: 'Last Updated' },
        ],
      },
      {
        key: 'lifetime_metrics',
        label: 'Lifetime',
        children: [
          { key: 'impression', label: 'Impressions', format: 'number' },
          { key: 'save', label: 'Saves', format: 'number' },
          { key: 'pin_click', label: 'Pin Clicks', format: 'number' },
          { key: 'outbound_click', label: 'Outbound Clicks', format: 'number' },
          { key: 'user_follow', label: 'User Follows', format: 'number' },
          { key: 'profile_visit', label: 'Profile Visits', format: 'number' },
          { key: 'reaction', label: 'Reactions', format: 'number' },
          { key: 'comment', label: 'Comments', format: 'number' },
          { key: 'last_updated', label: 'Last Updated' },
        ],
      },
    ],
  },
  { key: 'is_owner', label: 'Is Owner', format: 'boolean' },
  { key: 'is_standard', label: 'Is Standard', format: 'boolean' },
  { key: 'is_product', label: 'Is Product', format: 'boolean' },
  { key: 'is_removable', label: 'Is Removable', format: 'boolean' },
  { key: 'has_been_promoted', label: 'Has Been Promoted', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const createBoardActionOutputSchema: OutputSchema = { fields: boardFields };
export const updateBoardActionOutputSchema: OutputSchema = { fields: boardFields };

export const findBoardByNameActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Boards',
      labelKey: 'name',
      listItems: boardFields,
    },
    {
      key: 'bookmark',
      label: 'Next Page Bookmark',
      description: 'Pass back as "Bookmark" to fetch the next page.',
    },
  ],
};

export const createPinActionOutputSchema: OutputSchema = { fields: pinFields };

export const findPinActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Pins',
      labelKey: 'title',
      listItems: pinFields,
    },
    { key: 'total_results', label: 'Total Results', format: 'number' },
    { key: 'query_used', label: 'Query Used' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    {
      key: 'bookmark',
      label: 'Next Page Bookmark',
      description: 'Pass back as "Bookmark" to continue where these results end.',
    },
  ],
};

export const deletePinActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'pin_id', label: 'Pin ID' },
    { key: 'message', label: 'Message' },
  ],
};

export const newBoardTriggerOutputSchema: OutputSchema = { fields: boardFields };
export const newPinOnBoardTriggerOutputSchema: OutputSchema = { fields: pinFields };

// GET /user_account/followers returns only these two fields.
export const newFollowerTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'username', label: 'Username' },
    { key: 'type', label: 'Account Type' },
  ],
};

const userSummaryFields: OutputSchema['fields'] = [
  { key: 'username', label: 'Username' },
  { key: 'type', label: 'Account Type' },
];

const boardSectionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Section ID' },
  { key: 'name', label: 'Name' },
];

function paginatedSchema(
  label: string,
  listItems: OutputSchema['fields'],
  labelKey: string
): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems },
      { key: 'count', label: 'Count on This Page', format: 'number' },
      {
        key: 'bookmark',
        label: 'Next Page Bookmark',
        description:
          'Pass back as "Bookmark" to fetch the next page; null on the last page.',
      },
    ],
  };
}

export const getBoardActionOutputSchema: OutputSchema = { fields: boardFields };
export const getPinActionOutputSchema: OutputSchema = { fields: pinFields };
export const boardSectionActionOutputSchema: OutputSchema = {
  fields: boardSectionFields,
};

export const listBoardsActionOutputSchema = paginatedSchema(
  'Boards',
  boardFields,
  'name'
);
export const listPinsActionOutputSchema = paginatedSchema(
  'Pins',
  pinFields,
  'title'
);
export const listPinsOnBoardActionOutputSchema = paginatedSchema(
  'Pins',
  pinFields,
  'title'
);
export const listBoardSectionsActionOutputSchema = paginatedSchema(
  'Sections',
  boardSectionFields,
  'name'
);
export const listUserSummariesActionOutputSchema = paginatedSchema(
  'Accounts',
  userSummaryFields,
  'username'
);

export const deleteBoardActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'board_id', label: 'Board ID' },
    { key: 'message', label: 'Message' },
  ],
};

export const deleteBoardSectionActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'board_id', label: 'Board ID' },
    { key: 'section_id', label: 'Section ID' },
    { key: 'message', label: 'Message' },
  ],
};

export const userAccountActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Account ID' },
    { key: 'username', label: 'Username' },
    { key: 'account_type', label: 'Account Type' },
    { key: 'business_name', label: 'Business Name' },
    { key: 'website_url', label: 'Website', format: 'url' },
    { key: 'about', label: 'About' },
    { key: 'profile_image', label: 'Profile Image', format: 'image' },
    { key: 'board_count', label: 'Board Count', format: 'number' },
    { key: 'pin_count', label: 'Pin Count', format: 'number' },
    { key: 'follower_count', label: 'Follower Count', format: 'number' },
    { key: 'following_count', label: 'Following Count', format: 'number' },
    { key: 'monthly_views', label: 'Monthly Views', format: 'number' },
  ],
};

export const listLinkedBusinessesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Linked Businesses',
      labelKey: 'username',
      listItems: [
        { key: 'username', label: 'Username' },
        { key: 'image_small_url', label: 'Small Image', format: 'image' },
        { key: 'image_medium_url', label: 'Medium Image', format: 'image' },
        { key: 'image_large_url', label: 'Large Image', format: 'image' },
        { key: 'image_xlarge_url', label: 'Extra Large Image', format: 'image' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listVerifiedWebsitesActionOutputSchema = paginatedSchema(
  'Websites',
  [
    { key: 'website', label: 'Website', format: 'url' },
    { key: 'status', label: 'Verification Status' },
    { key: 'verified_at', label: 'Verified At', format: 'datetime' },
  ],
  'website'
);

export const listPinProductTagsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Product Tags',
      labelKey: 'pin_id',
      listItems: [
        { key: 'pin_id', label: 'Tagged Product Pin ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const pinAnalyticsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'all',
      label: 'All App Types',
      description:
        'Metrics for every app type combined; sibling keys such as WEB or MOBILE appear when the data is split.',
      children: [
        {
          key: 'summary_metrics',
          label: 'Summary Metrics',
          description:
            'Totals for the requested range, keyed by the metric names that were asked for.',
          dynamicKey: true,
        },
        {
          key: 'daily_metrics',
          label: 'Daily Metrics',
          labelKey: 'date',
          listItems: [
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'data_status', label: 'Data Status' },
            {
              key: 'metrics',
              label: 'Metrics',
              description: 'Values keyed by the requested metric names.',
              dynamicKey: true,
            },
          ],
        },
      ],
    },
  ],
};

export const accountAnalyticsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'all',
      label: 'All Pin Formats',
      description:
        'Metrics for every Pin format combined; sibling keys appear when the data is split.',
      children: [
        {
          key: 'summary_metrics',
          label: 'Summary Metrics',
          dynamicKey: true,
        },
        {
          key: 'daily_metrics',
          label: 'Daily Metrics',
          labelKey: 'date',
          listItems: [
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'data_status', label: 'Data Status' },
            {
              key: 'metrics',
              label: 'Metrics',
              dynamicKey: true,
            },
          ],
        },
      ],
    },
  ],
};

export const topPinsAnalyticsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'sort_by', label: 'Sorted By' },
    {
      key: 'pins',
      label: 'Top Pins',
      labelKey: 'pin_id',
      listItems: [
        { key: 'pin_id', label: 'Pin ID' },
        {
          key: 'metrics',
          label: 'Metrics',
          description:
            'Values keyed by metric name. Pinterest returns every metric it has, not only the one sorted on.',
          dynamicKey: true,
        },
        {
          key: 'data_status',
          label: 'Data Status',
          description: 'READY or PROCESSING, keyed by the same metric names.',
          dynamicKey: true,
        },
      ],
    },
    {
      key: 'date_availability',
      label: 'Date Availability',
      children: [
        {
          key: 'latest_available_timestamp',
          label: 'Latest Available',
          format: 'datetime',
        },
        { key: 'is_realtime', label: 'Is Realtime', format: 'boolean' },
      ],
    },
  ],
};
