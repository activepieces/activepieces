import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { promotionCodeOutputSchema } from '../output-schemas';
export const stripeGetPromotionCode = createAction({
  name: 'get_promotion_code',
  auth: stripeAuth,
  displayName: 'Get Promotion Code (Agent)',
  description: 'Retrieve a promotion code by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single promotion code by its ID (e.g., promo_...). Use List Promotion Codes to discover IDs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    promotion_code_id: Property.ShortText({
      displayName: 'Promotion Code ID',
      description:
        'The promotion code ID (e.g., promo_...). Obtain it from List Promotion Codes.',
      required: true,
    }),
  },
  outputSchema: promotionCodeOutputSchema,
  async run(context) {
    const { promotion_code_id } = context.propsValue;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/promotion_codes/${promotion_code_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });
    return response.body;
  },
});
