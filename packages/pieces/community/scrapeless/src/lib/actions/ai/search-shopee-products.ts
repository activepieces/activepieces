import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const searchShopeeProductsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_search_shopee_products',
  displayName: 'Search Shopee Products',
  description: 'Searches a Shopee site for products by keyword.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Searches a Shopee marketplace by keyword and returns one page of items with their shopid and itemid for Get Shopee Product. Page with Offset. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({
      displayName: 'Shopee Domain',
      description:
        'Shopee site host, e.g. "shopee.sg", "shopee.tw", "shopee.co.th".',
      required: true,
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Search keyword, e.g. "hp 1020 toner".',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Items per page. Defaults to 30.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of items to skip, for paging. Defaults to 0.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const query = new URLSearchParams({
      keyword: propsValue.keyword,
      limit: String(propsValue.limit ?? 30),
      newest: String(propsValue.offset ?? 0),
      order: 'desc',
      page_type: 'search',
      scenario: 'page_global_search',
      version: '2',
    });
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.shopee',
      input: {
        url: `https://${
          propsValue.domain
        }/api/v4/search/search_items?${query.toString()}`,
      },
    });
  },
});
