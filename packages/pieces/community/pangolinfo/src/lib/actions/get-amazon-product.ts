import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pangolinfoAuth } from '../auth';
import { pangolinfoClient } from '../common';
import { pangolinfoProps } from '../props';

const getAmazonProduct = createAction({
  name: 'get_amazon_product',
  displayName: 'Get Amazon Product',
  description:
    'Retrieve current structured Amazon product details by ASIN with the Pangolinfo Amazon Scraper API.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves current structured Amazon product data for a specific ASIN and marketplace. Use for catalog enrichment, price and availability checks, and competitive research. Read-only and idempotent.',
    idempotent: true,
  },
  auth: pangolinfoAuth,
  props: {
    asin: Property.ShortText({
      displayName: 'ASIN',
      description: 'Amazon product ASIN.',
      required: true,
    }),
    site: pangolinfoProps.amazonSite,
    zipcode: pangolinfoProps.zipcode,
  },
  async run(context) {
    const { asin, site, zipcode } = context.propsValue;
    return pangolinfoClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v1/scrape',
      body: {
        parserName: 'amzProductDetail',
        site,
        content: asin,
        format: 'json',
        bizContext: { zipcode: zipcode ?? '10041' },
      },
    });
  },
});

export { getAmazonProduct };
