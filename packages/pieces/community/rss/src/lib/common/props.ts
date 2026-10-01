import { Property } from '@activepieces/pieces-framework';

export const rssFeedUrl = Property.ShortText({
  displayName: 'RSS Feed URL',
  description: 'Link to the feed itself, not the site homepage; Atom works too.',
  placeholder: 'https://example.com/feed.xml',
  required: true,
});

export const rssFeedUrls = Property.Array({
  displayName: 'RSS Feed URLs',
  description: 'One feed address per row; a feed that fails to load is skipped.',
  required: true,
  defaultValue: [],
});