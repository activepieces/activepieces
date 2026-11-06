import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { FIRECRAWL_API_BASE_URL, FIRECRAWL_ORIGIN } from '../common/common';
import { mapWebsiteActionOutputSchema } from '../output-schemas';

export const map = createAction({
    auth: firecrawlAuth,
    name: 'map',
    classification: 'SEARCH',
    displayName: 'Map Website',
    description: 'List the links found on a website.',
    audience: 'human',
    outputSchema: mapWebsiteActionOutputSchema,
    aiMetadata: { description: 'Discovers and returns the list of URLs reachable from a given website, optionally including subdomains, up to a configurable limit. Choose this for fast site-map / link discovery when you only need the URLs and not page content; follow with Scrape, Crawl, or Extract to fetch the pages. Read-only against the site, so repeating the call is safe.', idempotent: true },
    props: {
      url: Property.ShortText({
        displayName: 'Website URL',
        description: 'The site to list links from.',
        placeholder: 'https://example.com',
        required: true,
      }),
      subdomain: Property.Checkbox({
        displayName: 'Include Subdomains',
        description: 'Also list pages on subdomains, like blog.example.com.',
        required: false,
        defaultValue: false,
      }),
      limit: Property.Number({
        displayName: 'Max Links',
        description: 'Most links to return, up to 100,000.',
        required: false,
        defaultValue: 5000,
      }),
    },
    propertyGroups: [
      { key: 'site', display: 'section', label: 'Site', icon: 'file', props: ['url', 'subdomain', 'limit'] },
    ],

    async run(context) {
      const { auth, propsValue } = context;
      const body: Record<string, any> = {
        url: propsValue.url,
        sitemap: 'include',
        includeSubdomains: propsValue.subdomain,
        limit: propsValue.limit,
        origin: FIRECRAWL_ORIGIN,
      };
      
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${FIRECRAWL_API_BASE_URL}/map`,
        headers: {
          'Authorization': `Bearer ${auth.secret_text}`,
          'Content-Type': 'application/json'
        },
        body: body,
      });

      return response.body;
    }
})