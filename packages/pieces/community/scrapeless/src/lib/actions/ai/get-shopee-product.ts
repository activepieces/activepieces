import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getShopeeProductAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_shopee_product',
  displayName: 'Get Shopee Product',
  description: 'Gets the details of a Shopee product.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets a Shopee product's details (title, price, stock, variants, rating, shop) by shop id and item id, as returned by Search Shopee Products. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    domain: Property.ShortText({
      displayName: 'Shopee Domain',
      description:
        'Shopee site host, e.g. "shopee.sg", "shopee.tw", "shopee.co.th".',
      required: true,
    }),
    shopId: Property.ShortText({
      displayName: 'Shop ID',
      description: 'Shopee shop id (shopid), from Search Shopee Products.',
      required: true,
    }),
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'Shopee item id (itemid), from Search Shopee Products.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { domain, shopId, itemId } = propsValue;
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.shopee',
      input: {
        url: `https://${domain}/product/${encodeURIComponent(
          shopId
        )}/${encodeURIComponent(itemId)}`,
      },
    });
  },
});
