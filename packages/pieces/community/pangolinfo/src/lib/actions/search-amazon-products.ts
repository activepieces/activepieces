import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pangolinfoAuth } from '../auth';
import { pangolinfoClient } from '../common';
import { pangolinfoProps } from '../props';

const searchAmazonProducts = createAction({
  name: 'search_amazon_products',
  displayName: 'Search Amazon Products',
  description:
    'Search Amazon by keyword and return structured product rankings with Pangolinfo.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Amazon by a buyer keyword and returns structured product results. Use for ranking research, assortment analysis, product discovery, or competitive monitoring. Read-only and idempotent.',
    idempotent: true,
  },
  auth: pangolinfoAuth,
  props: {
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Buyer keyword to search on Amazon.',
      required: true,
    }),
    site: pangolinfoProps.amazonSite,
    zipcode: pangolinfoProps.zipcode,
  },
  async run(context) {
    const { keyword, site, zipcode } = context.propsValue;
    return pangolinfoClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v1/scrape',
      body: {
        parserName: 'amzKeyword',
        site,
        content: keyword,
        format: 'json',
        bizContext: { zipcode: zipcode ?? '10041' },
      },
    });
  },
});

export { searchAmazonProducts };
