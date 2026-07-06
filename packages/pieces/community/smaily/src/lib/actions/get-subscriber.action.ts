import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { smailyAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getSubscriberAction = createAction({
  auth: smailyAuth,
  name: 'get-subscriber',
  displayName: 'Get Subscriber',
  description:
    'retrieves detailed subscriber information for a given email address.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a single subscriber in a Smaily account by their email address and return their stored details (subscription status and custom fields). Use to check whether a contact exists or to read their current data before acting on it. Read-only and idempotent; requires the exact email.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://${context.auth.props.domain}.sendsmaily.net/api/contact.php`,
      queryParams: {
        email: context.propsValue.email,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BASIC,
            username: context.auth.props.username,
        password: context.auth.props.password,
      },
    });

    return response.body;
  },
});
