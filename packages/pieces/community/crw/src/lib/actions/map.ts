import { createAction, Property, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { crwAuth } from '../auth';
import { CRW_API_BASE_URL } from '../common/common';

export const map = createAction({
    auth: crwAuth,
    name: 'map',
    displayName: 'Map Websites',
    description: 'Input a website and get all the urls on the website.' ,
    audience: 'both',
    aiMetadata: { description: 'Discovers and returns the list of URLs reachable from a given website, optionally including subdomains, up to a configurable limit. Choose this for fast site-map / link discovery when you only need the URLs and not page content; follow with Scrape, Crawl, or Extract to fetch the pages. Read-only against the site, so repeating the call is safe.', idempotent: true },
    props: {
      url: Property.ShortText({
        displayName: 'Main Website URL',
        description: 'The webpage URL to start scraping from.',
        required: true,
      }),
      subdomain: Property.Checkbox({
        displayName: 'Include subdomain',
        description: 'Include and crawl pages from subdomains of the target website (e.g., blog.example.com, shop.example.com) in addition to the main domain.',
        required: false,
        defaultValue: false
      }),
      limit: Property.Number({
        displayName: 'Limit',
        description: 'Maximum number of links to return (max: 100,000)',
        required: false,
        defaultValue: 5000,
      }),
    },

    async run(context) {
      const { auth, propsValue } = context;
      const body: Record<string, any> = {
        url: propsValue.url,
        sitemap: 'include',
        includeSubdomains: propsValue.subdomain,
        limit: propsValue.limit,
      };

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${CRW_API_BASE_URL}/map`,
        headers: {
          'Authorization': `Bearer ${auth.secret_text}`,
          'Content-Type': 'application/json'
        },
        body: body,
      });

      return response.body;
    }
})
