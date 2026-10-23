import { createAction, Property } from '@activepieces/pieces-framework';

import { scrapelessApiAuth } from '../../auth';
import { scrapelessApi } from '../../common/api';

export const getAmazonSellerAction = createAction({
  auth: scrapelessApiAuth,
  name: 'scrapeless_get_amazon_seller',
  displayName: 'Get Amazon Seller',
  description: 'Gets the details of an Amazon seller page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Scrapes an Amazon seller profile page and returns the seller's name, rating, feedback and business details. If the scrape hasn't finished, completed is false; pass taskId to Get Scraper Result.",
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Seller URL',
      description:
        'Amazon seller page URL, e.g. "https://www.amazon.com/sp?seller=A2XZ7JICGUQ1CX".',
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
        type: 'seller',
        url: propsValue.url,
        zip_code: propsValue.zipCode,
      },
    });
  },
});
