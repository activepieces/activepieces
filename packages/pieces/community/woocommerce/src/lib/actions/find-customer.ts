import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

import { wooAuth } from '../..';

export const wooFindCustomer = createAction({
  name: 'Find Customer',
  displayName: 'Find Customer',
  description: 'Find a Customer',
  auth: wooAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Enter the email',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.baseUrl.replace(/\/$/, '');
    const email = configValue.propsValue['email'];

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/customers?email=${email}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.consumerKey,
        password: configValue.auth.consumerSecret,
      },
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
