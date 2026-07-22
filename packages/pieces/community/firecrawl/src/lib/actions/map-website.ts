import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL } from '../common/common';
import { mapWebsiteActionOutputSchema } from '../output-schemas';

export const mapWebsite = createAction({
  auth: firecrawlAuth,
  name: 'map_website',
  displayName: 'Map Website',
  description: 'Discover and return the list of URLs reachable from a website.',
  audience: 'ai',
  outputSchema: mapWebsiteActionOutputSchema,
  aiMetadata: {
    description:
      'Enumerates the URLs reachable from a website (via its sitemap and link graph), optionally including subdomains, up to a limit. Pick this for fast link/URL discovery when you only need the addresses and not page content; then follow with Scrape URL, Batch Scrape, or Crawl Website to fetch pages, or Search Web when you have a query instead of a domain. Read-only, so repeating the call is safe.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The website URL to map (e.g. https://example.com).',
      required: true,
    }),
    search: Property.ShortText({
      displayName: 'Search Filter',
      description: 'Optional keyword to filter the discovered URLs (e.g. "blog" to return only blog paths).',
      required: false,
    }),
    includeSubdomains: Property.Checkbox({
      displayName: 'Include Subdomains',
      description: 'Include pages from subdomains (e.g. blog.example.com) in addition to the main domain.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of links to return (max: 100,000).',
      required: false,
      defaultValue: 5000,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      url: propsValue.url,
      sitemap: 'include',
      includeSubdomains: propsValue.includeSubdomains,
      limit: propsValue.limit,
    };
    if (propsValue.search) {
      body['search'] = propsValue.search;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${FIRECRAWL_API_BASE_URL}/map`,
        headers: {
          'Authorization': `Bearer ${auth.secret_text}`,
          'Content-Type': 'application/json',
        },
        body,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): your API key plan does not permit mapping or has insufficient credits.');
      }
      if (status === 404) {
        throw new Error('The website could not be mapped (404): the URL was not found.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
