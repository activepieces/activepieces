import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getTiktokShopProductAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_tiktok_shop_product',
  displayName: 'Get TikTok Shop Product',
  description: 'Gets a TikTok Shop product page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets a TikTok Shop product's details (title, price, variants, seller, reviews) by product id and region. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'TikTok Shop product id, e.g. "1729411983267761850".',
      required: true,
    }),
    region: Property.ShortText({
      displayName: 'Region',
      description:
        'Country or region code of the shop, e.g. "GB", "US", "SG", "JP".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.tiktok.shop.page',
      input: {
        product_id: propsValue.productId,
        region: propsValue.region,
      },
    });
  },
});
