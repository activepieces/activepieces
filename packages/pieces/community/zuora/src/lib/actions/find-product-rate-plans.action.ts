import { zuoraAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken } from '../common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const findProductRatePlanAction = createAction({
  auth: zuoraAuth,
  name: 'find-product-rate-plan',
  displayName: 'Find Product Rate Plan',
  description: 'Retrieves product rate plan with charges.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a Zuora product rate plan (and its expanded rate plan charges) by exact rate plan name scoped to a specific product ID. Use to find the rate plan charge IDs needed when creating an invoice or subscription; both the rate plan name and the product ID are required and matched by exact equality. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Product Rate Plan Name',
      description: 'i.e. StealthCo Premium',
      required: true,
    }),
    productid: Property.ShortText({
      displayName: 'Product ID',
      required: true,
    }),
  },
  async run(context) {
    const name = context.propsValue.name;
    const productid = context.propsValue.productid;
    const token = await getAccessToken(context.auth);

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${context.auth.props.environment}/object-query/product-rate-plans?filter[]=name.EQ:${name}&filter[]=productid.EQ:${productid}`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams: {
        'expand[]': 'productrateplancharges',
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
