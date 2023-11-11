import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';
import { webflowCommon } from '../common/common';

export const webflowUnfulfillOrder = createAction({
  auth: webflowAuth,
  name: 'unfulfill_order',
  description: 'Unfulfill order',
  displayName: 'Unfulfill an order',
  props: {
    site_id: webflowCommon.sitesDropdown,
    order_id: webflowCommon.ordersDropdown,
  },

  async run(configValue) {
    const accessToken = configValue.auth['access_token'];
    const orderId = configValue.propsValue['order_id'];
    const siteId = configValue.propsValue['site_id'];

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.webflow.com/sites/${siteId}/orders/${orderId}/unfulfill`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
