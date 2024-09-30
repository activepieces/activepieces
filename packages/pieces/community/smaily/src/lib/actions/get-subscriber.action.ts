import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { smailyAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getSubscriberAction = createAction({
  auth: smailyAuth,
  name: 'get-subscriber',
  displayName: 'Get Subscriber',
  description:
    'Retrives detailed subscriber information for a given email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run(contex) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${contex.auth.domain}.sendsmaily.net/api/contact.php`,
      queryParams: {
        email: contex.propsValue.email,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: contex.auth.username,
        password: contex.auth.password,
      },
    });

    return response.body;
  },
});
