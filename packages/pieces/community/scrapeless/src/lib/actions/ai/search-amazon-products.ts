import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const searchAmazonProductsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_search_amazon_products',
  displayName: 'Search Amazon Products',
  description: 'Searches Amazon for products by keyword.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Searches Amazon by keyword and returns one page of product results with ASINs, titles, prices, ratings and product URLs for Get Amazon Product. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Search keywords, e.g. "iphone 14 pro".',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Amazon Domain',
      description:
        'Amazon site suffix, e.g. "com" (the default), "co.uk", "de".',
      required: false,
    }),
    department: Property.ShortText({
      displayName: 'Department',
      description:
        'Amazon department alias (the "i" search parameter), e.g. "electronics".',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Results page number, starting at 1. Defaults to 1.',
      required: false,
    }),
    zipCode: Property.ShortText({
      displayName: 'ZIP Code',
      description:
        'Delivery postal code, to get delivery and availability for that location.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.amazon',
      input: {
        type: 'keywords',
        keywords: propsValue.keywords,
        domain: propsValue.domain,
        department: propsValue.department,
        page: propsValue.page,
        zip_code: propsValue.zipCode,
      },
    });
  },
});
