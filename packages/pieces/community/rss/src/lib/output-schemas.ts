import { OutputSchema } from '@activepieces/pieces-framework';

export const newItemTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'link',
      label: 'Link',
      format: 'url',
    },
    {
      key: 'author',
      label: 'Author',
    },
    {
      key: 'pubDate',
      label: 'Published Date',
      format: 'datetime',
    },
    {
      key: 'date',
      label: 'Date',
      format: 'datetime',
    },
    {
      key: 'description',
      label: 'Description',
      format: 'html',
    },
    {
      key: 'summary',
      label: 'Summary',
      format: 'html',
    },
    {
      key: 'guid',
      label: 'GUID',
    },
    {
      key: 'enclosures',
      label: 'Enclosures',
      labelKey: 'url',
      listItems: [
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
      ],
    },
    {
      key: 'feed',
      label: 'Feed',
      value: 'meta',
      children: [
        {
          key: 'title',
          label: 'Feed Title',
          value: 'title',
        },
        {
          key: 'description',
          label: 'Feed Description',
          value: 'description',
        },
        {
          key: 'link',
          label: 'Feed Link',
          value: 'link',
          format: 'url',
        },
        {
          key: 'author',
          label: 'Feed Author',
          value: 'author',
        },
        {
          key: 'language',
          label: 'Language',
          value: 'language',
        },
        {
          key: 'imageUrl',
          label: 'Feed Image',
          value: 'image.url',
          format: 'image',
        },
        {
          key: 'pubDate',
          label: 'Feed Published Date',
          value: 'pubDate',
          format: 'datetime',
        },
      ],
    },
  ],
};

export const newItemListTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'author',
      label: 'Author',
    },
    {
      key: 'date',
      label: 'Date',
      format: 'datetime',
    },
    {
      key: 'link',
      label: 'Link',
      format: 'url',
    },
    {
      key: 'description',
      label: 'Description',
      format: 'html',
    },
    {
      key: 'summary',
      label: 'Summary',
      format: 'html',
    },
    {
      key: 'guid',
      label: 'GUID',
    },
    {
      key: 'enclosures',
      label: 'Enclosures',
      labelKey: 'url',
      listItems: [
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
      ],
    },
    {
      key: 'meta',
      label: 'Feed Info',
      children: [
        {
          key: 'title',
          label: 'Feed Title',
          value: 'title',
        },
        {
          key: 'description',
          label: 'Feed Description',
          value: 'description',
        },
        {
          key: 'link',
          label: 'Feed Link',
          value: 'link',
          format: 'url',
        },
        {
          key: 'xmlurl',
          label: 'Feed URL',
          value: 'xmlurl',
          format: 'url',
        },
        {
          key: 'language',
          label: 'Language',
          value: 'language',
        },
        {
          key: 'date',
          label: 'Feed Date',
          value: 'date',
          format: 'datetime',
        },
        {
          key: 'imageUrl',
          label: 'Feed Image',
          value: 'image.url',
          format: 'image',
        },
      ],
    },
  ],
};

const feedItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Item ID' },
  { key: 'title', label: 'Title' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'author', label: 'Author' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'summary', label: 'Summary', format: 'html' },
  { key: 'content', label: 'Content', format: 'html' },
  { key: 'categories', label: 'Categories' },
  { key: 'image_url', label: 'Image', format: 'image' },
];

const enclosuresField: OutputSchema['fields'][number] = {
  key: 'enclosures',
  label: 'Enclosures',
  labelKey: 'url',
  listItems: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'type', label: 'Media Type' },
    { key: 'length', label: 'Size', format: 'filesize' },
  ],
};

export const rssFindSiteFeedsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'feeds',
      label: 'Feeds',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'Feed URL', format: 'url' },
        { key: 'title', label: 'Title' },
        { key: 'format', label: 'Format' },
      ],
    },
    { key: 'count', label: 'Feeds Found', format: 'number' },
  ],
};

export const rssReadFeedOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'feed',
      label: 'Feed',
      children: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'site_url', label: 'Site URL', format: 'url' },
        { key: 'feed_url', label: 'Feed URL', format: 'url' },
        { key: 'language', label: 'Language' },
        { key: 'author', label: 'Author' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'image_url', label: 'Image', format: 'image' },
        { key: 'format', label: 'Format' },
      ],
    },
    {
      key: 'items',
      label: 'Items',
      labelKey: 'title',
      listItems: [...feedItemFields, enclosuresField],
    },
    { key: 'count', label: 'Items Returned', format: 'number' },
    { key: 'total_in_feed', label: 'Total Items in Feed', format: 'number' },
  ],
};

export const rssReadMultipleFeedsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'title',
      listItems: [
        ...feedItemFields,
        { key: 'enclosures', label: 'Enclosures' },
        { key: 'feed_title', label: 'Feed Title' },
        { key: 'feed_url', label: 'Feed URL', format: 'url' },
      ],
    },
    { key: 'count', label: 'Items Returned', format: 'number' },
    {
      key: 'feeds',
      label: 'Loaded Feeds',
      labelKey: 'title',
      listItems: [
        { key: 'feed_url', label: 'Feed URL', format: 'url' },
        { key: 'title', label: 'Title' },
        { key: 'site_url', label: 'Site URL', format: 'url' },
        { key: 'item_count', label: 'Items in Feed', format: 'number' },
      ],
    },
    {
      key: 'failed',
      label: 'Failed Feeds',
      labelKey: 'feed_url',
      listItems: [
        { key: 'feed_url', label: 'Feed URL', format: 'url' },
        { key: 'error', label: 'Error' },
      ],
    },
  ],
};
