import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';
import { webflowCommon } from '../common/common';

export const webflowFulfillOrder = createAction({
  auth: webflowAuth,
  name: 'fulfill_order',
  description: 'Fulfill order',
  displayName: 'Fulfill an order',
  props: {
    site_id: webflowCommon.sitesDropdown,
    order_id: webflowCommon.ordersDropdown,
    send_order_fulfilled_email: Property.Checkbox({
      displayName: 'Send Order Fulfilled Email',
      description:
        'Send an email to the customer that their order has been fulfilled',
      required: false,
    }),
  },

  async run(configValue) {
    const accessToken = configValue.auth['access_token'];
    const orderId = configValue.propsValue['order_id'];
    const siteId = configValue.propsValue['site_id'];
    const sendOrderFulfilledEmail =
      configValue.propsValue['send_order_fulfilled_email'];

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.webflow.com/sites/${siteId}/orders/${orderId}/fulfill`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      body: {
        sendOrderFulfilledEmail,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
