import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';
import { webflowCommon } from '../common/common';

export const webflowFindOrder = createAction({
  auth: webflowAuth,
  name: 'find_order',
  description: 'Find order',
  displayName: 'Find an order',
  props: {
    site_id: webflowCommon.sitesDropdown,
    order_id: webflowCommon.ordersDropdown,
  },

  async run(configValue) {
    const accessToken = configValue.auth['access_token'];
    const orderId = configValue.propsValue['order_id'];
    const siteId = configValue.propsValue['site_id'];

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.webflow.com/sites/${siteId}/orders/${orderId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
