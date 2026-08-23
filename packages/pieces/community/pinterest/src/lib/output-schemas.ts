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
  { key: 'pin_metrics', label: 'Pin Metrics' },
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
      description: 'Pass back as "Bookmark" to fetch the next page.',
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
