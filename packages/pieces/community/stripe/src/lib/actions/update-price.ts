import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { priceOutputSchema } from '../output-schemas';
export const stripeUpdatePrice = createAction({
  name: 'update_price',
  classification: 'WRITE',
  auth: stripeAuth,
  displayName: 'Update Price (Agent)',
  description: 'Update or archive a Stripe price.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a Stripe price (set active=no to archive it, or edit its nickname/metadata). The unit amount is immutable — create a new price to change it. active takes yes, no or unchanged; leave it out or pass unchanged to keep the price active or archived as it is. Only the fields you supply change. Idempotent: re-applying the same update converges.',
    idempotent: true,
  },
  props: {
    price_id: Property.ShortText({
      displayName: 'Price ID',
      description:
        'The price ID (e.g., price_...). Obtain it from List/Search Prices.',
      required: true,
    }),
    active: stripeCommon.triStateProp({
      displayName: 'Active',
      description: 'No archives the price, Yes makes it available again.',
    }),
    nickname: Property.ShortText({
      displayName: 'Nickname',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      required: false,
    }),
  },
  outputSchema: priceOutputSchema,
  async run(context) {
    const { price_id, nickname, metadata } = context.propsValue;
    const active = stripeCommon.triStateValue(context.propsValue.active);

    const body: { [key: string]: unknown } = {};
    if (active !== undefined) body.active = active;
    if (nickname) body.nickname = nickname;
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach((key) => {
        body[`metadata[${key}]`] = (metadata as Record<string, string>)[key];
      });
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/prices/${price_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
