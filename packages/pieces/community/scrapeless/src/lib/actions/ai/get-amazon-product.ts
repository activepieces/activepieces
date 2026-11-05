import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getAmazonProductAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_amazon_product',
  displayName: 'Get Amazon Product',
  description: 'Gets the details of an Amazon product page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Scrapes an Amazon product page and returns its title, price, ASIN, rating, images, variants and seller details. Product URLs come from Search Amazon Products. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Product URL',
      description:
        'Amazon product page URL, e.g. "https://www.amazon.com/dp/B0BQXHK363".',
      required: true,
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
        type: 'product',
        url: propsValue.url,
        zip_code: propsValue.zipCode,
      },
    });
  },
});
