import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingaiAuth } from '../../index';
import { BASE_URL, apiHeaders } from '../common/common';

export const crawlWebsite = createAction({
  name: 'crawl_website',
  displayName: 'Crawl Website',
  description: 'Traverse an entire domain or section to collect structured content across multiple linked pages',
  auth: dumplingaiAuth,
  props: {
    start_url: Property.ShortText({
      displayName: 'Start URL',
      required: true,
      description: 'The starting URL for the crawler',
    }),
    max_pages: Property.Number({
      displayName: 'Maximum Pages',
      required: false,
      description: 'Maximum number of pages to crawl',
      defaultValue: 10,
    }),
    stay_within_domain: Property.Checkbox({
      displayName: 'Stay Within Domain',
      required: false,
      description: 'Whether to stay within the same domain while crawling',
      defaultValue: true,
    }),
    pattern: Property.ShortText({
      displayName: 'URL Pattern',
      required: false,
      description: 'Optional regex pattern to match URLs for crawling',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/crawl`,
      headers: apiHeaders(auth),
      body: {
        start_url: propsValue.start_url,
        max_pages: propsValue.max_pages,
        stay_within_domain: propsValue.stay_within_domain,
        pattern: propsValue.pattern,
      },
    });

    return response.body;
  },
}); 