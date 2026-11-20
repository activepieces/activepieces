import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const imageFields: OutputSchemaField[] = [
  { key: 'asset_id', label: 'Asset ID', description: 'AltText.ai identifier of the image; use it with Get, Update or Delete Image.' },
  { key: 'url', label: 'Image URL', format: 'url' },
  { key: 'alt_text', label: 'Alt Text' },
  { key: 'alt_texts', label: 'Alt Text by Language', dynamicKey: true },
  { key: 'tags', label: 'Tags' },
  { key: 'metadata', label: 'Metadata' },
  { key: 'created_at', label: 'Created At (Unix Seconds)', format: 'number' },
  { key: 'errors', label: 'Errors' },
  { key: 'error_code', label: 'Error Code' },
];

const image: OutputSchema = { fields: imageFields };

const generatedImage: OutputSchema = {
  fields: [
    ...imageFields,
    {
      key: 'note',
      label: 'Note',
      description: 'Set when AltText.ai returned an image that already existed instead of generating new alt text.',
    },
  ],
};

const imageList: OutputSchema = {
  fields: [
    { key: 'images', label: 'Images', listItems: imageFields, labelKey: 'asset_id' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'next_page', label: 'Next Page', format: 'number', description: 'Page number to request next; empty when this is the last page.' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
  ],
};

const deleted: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'asset_id', label: 'Asset ID' },
  ],
};

const account: OutputSchema = {
  fields: [
    { key: 'name', label: 'Account Name' },
    { key: 'usage', label: 'Credits Used', format: 'number' },
    { key: 'usage_limit', label: 'Credit Limit', format: 'number' },
    { key: 'credits_remaining', label: 'Credits Remaining', format: 'number' },
    { key: 'default_lang', label: 'Default Language' },
    { key: 'plan_name', label: 'Plan Name' },
    { key: 'renews_at', label: 'Renews At', format: 'datetime' },
  ],
};

export const altTextAiOutputSchemas = { image, generatedImage, imageList, deleted, account };
