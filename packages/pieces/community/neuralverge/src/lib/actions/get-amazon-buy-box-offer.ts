import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const getAmazonBuyBoxOfferAction = createAction({
  auth: neuralvergeAuth,
  name: 'get_amazon_buy_box_offer',
  classification: 'READ',
  displayName: 'Get Amazon Buy Box Offer',
  description: 'Get the current Buy Box offer and its seller for an ASIN. Cost: 5 points per offer (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Get the current Buy Box offer for an ASIN: price, condition, shipping, Prime flag and seller. Returns the Buy Box offer only, not every seller. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    asin: Property.ShortText({
      displayName: 'ASIN',
      description: 'Amazon product ASIN, for example B004YAVF8I.',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Marketplace Domain',
      description: 'Amazon marketplace domain, for example amazon.com, amazon.co.uk or amazon.de.',
      required: false,
      defaultValue: "amazon.com",
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-amazon-product-offers',
      body: {
        asin: propsValue.asin,
        domain: propsValue.domain,
      },
    });
  },
});
