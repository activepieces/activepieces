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
