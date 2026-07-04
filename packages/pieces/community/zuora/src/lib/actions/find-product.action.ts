import { zuoraAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken } from '../common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const findProductAction = createAction({
  auth: zuoraAuth,
  name: 'find-product',
  displayName: 'Find Product',
  description: 'Retrieves product based on sku.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a Zuora product by exact SKU match via an object query. Use to resolve a product (e.g. to obtain its product ID before finding rate plans) when you know the SKU; matching is exact equality on the SKU, not a partial search. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    sku: Property.ShortText({
      displayName: 'Product SKU',
      required: true,
    }),
  },
  async run(context) {
    const sku = context.propsValue.sku;
    const token = await getAccessToken(context.auth);

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${context.auth.props.environment}/object-query/products`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams: {
        'filter[]': `sku.EQ:${sku}`,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
