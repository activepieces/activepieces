import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { smailyAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';

export const createOrUpdateSubscriberAction = createAction({
  auth: smailyAuth,
  name: 'create-or-update-subscriber',
  displayName: 'Create or Update Subscriber',
  description:
    'Creates a new subscriber or update an existing subscriber by email.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    is_unsubscribed: Property.StaticDropdown({
      displayName: 'Subscription Status',
      required: true,
      defaultValue: 0,
      options: {
        disabled: false,
        options: [
          { label: 'Unsubscribed', value: 1 },
          { label: 'Subscribed', value: 0 },
        ],
      },
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: `Go to **Subscribers Tab-> All Subscribers -> Manage Fields** to get custom field names.`,
      required: false,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://${context.auth.domain}.sendsmaily.net/api/contact.php`,
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BASIC,
        username: context.auth.username,
        password: context.auth.password,
      },
      body: {
        email: context.propsValue.email,
        is_unsubscribed: context.propsValue.is_unsubscribed,
        ...context.propsValue.custom_fields,
      },
    });

    return response.body;
  },
});
