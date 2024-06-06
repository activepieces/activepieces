import { zuoraAuth } from '../../';
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
      url: `${context.auth.environment}/object-query/products`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams: {
        'filter[]': `sku.EQ:${sku}`,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
