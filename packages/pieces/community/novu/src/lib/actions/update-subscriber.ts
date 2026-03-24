import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { novuAuth } from '../..';

export const updateSubscriber = createAction({
  auth: novuAuth,
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update an existing subscriber in Novu',
  props: {
    subscriber_id: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The subscriber ID to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    avatar: Property.ShortText({
      displayName: 'Avatar URL',
      required: false,
    }),
  },
  async run(context) {
    const { subscriber_id, email, first_name, last_name, phone, avatar } =
      context.propsValue;

    const body: Record<string, unknown> = {};
    if (email) body['email'] = email;
    if (first_name) body['firstName'] = first_name;
    if (last_name) body['lastName'] = last_name;
    if (phone) body['phone'] = phone;
    if (avatar) body['avatar'] = avatar;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `https://api.novu.co/v1/subscribers/${encodeURIComponent(subscriber_id)}`,
      body,
      headers: {
        Authorization: `ApiKey ${context.auth}`,
      },
      authentication: {
        type: AuthenticationType.CUSTOM,
      },
    });
    return response.body;
  },
});
