import { Property } from '@activepieces/pieces-framework';

export const rssFeedUrl = Property.ShortText({
  displayName: 'RSS Feed URL',
  description: 'Single RSS feed URL',
  required: true,
});

export const rssFeedUrls = Property.Array({
  displayName: 'RSS Feed URLs',
  description: 'List of RSS feed URLs',
  required: true,
  defaultValue: [],
});