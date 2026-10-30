import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const listShopeeShopItemsAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_list_shopee_shop_items',
  displayName: 'List Shopee Shop Items',
  description: 'Lists a Shopee shop’s top-selling items.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists one page of a Shopee shop's items, sorted by top sales, with each item's itemid for Get Shopee Product. Needs the shop id from Search Shopee Products. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
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
      bundle: 'shop_page_category_tab_main',
      item_card_use_scene: 'category_product_list_topsales',
      limit: String(propsValue.limit ?? 30),
      offset: String(propsValue.offset ?? 0),
      shop_id: propsValue.shopId,
      sort_type: '13',
      upstream: '',
    });
    return await scrapelessApi.runScraper({
      auth,
      actor: 'scraper.shopee',
      input: {
        action: 'shopee.rcmd',
        url: `https://${
          propsValue.domain
        }/api/v4/shop/rcmd_items?${query.toString()}`,
      },
    });
  },
});
