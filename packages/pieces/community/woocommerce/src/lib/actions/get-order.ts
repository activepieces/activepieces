import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { getOrderOutputSchema } from '../output-schemas';

export const wooGetOrder = createAction({
  name: 'Get Order',
  classification: 'READ',
  displayName: 'Get Order',
  description: 'Retrieve a single order by its ID',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves one order from a WooCommerce store by its numeric order ID, including line items, billing and shipping addresses, totals, and status. Use when an agent already has an order ID and needs the full order record. Read-only and idempotent.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: getOrderOutputSchema,
  props: {
    id: Property.ShortText({
      displayName: 'Order ID',
      description: 'Enter the order ID',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const orderId = configValue.propsValue['id'];

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/orders/${orderId}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
