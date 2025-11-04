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
    'retrieves detailed subscriber information for a given email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${context.auth.domain}.sendsmaily.net/api/contact.php`,
      queryParams: {
        email: context.propsValue.email,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.username,
        password: context.auth.password,
      },
    });

    return response.body;
  },
});
