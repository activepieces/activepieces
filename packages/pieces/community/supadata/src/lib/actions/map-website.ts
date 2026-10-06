import { createAction, Property } from '@activepieces/pieces-framework';
import { supadataAuth } from '../auth';
import { supadataClient } from '../common/client';
import { supadataMapWebsiteOutputSchema } from '../output-schemas';

export const mapWebsiteAction = createAction({
  name: 'supadata_map_website',
  outputSchema: supadataMapWebsiteOutputSchema,
  displayName: 'Map Website',
  description: 'Lists the URLs found on a website.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Scans a whole website and returns the URLs found on it, useful for building a sitemap or choosing pages to scrape. Read-only.',
    idempotent: true,
  },
  auth: supadataAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Website URL to map.',
      required: true,
    }),
  },
  async run(context) {
    const { url } = context.propsValue;
    return supadataClient.request({
      apiKey: context.auth.secret_text,
      method: supadataClient.GET,
      path: '/web/map',
      query: { url },
    });
  },
});
