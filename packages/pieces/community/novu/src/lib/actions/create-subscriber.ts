import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { novuAuth } from '../..';

export const createSubscriber = createAction({
  auth: novuAuth,
  name: 'create_subscriber',
  displayName: 'Create Subscriber',
  description: 'Create a new subscriber in Novu',
  props: {
    subscriber_id: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'Unique identifier for the subscriber',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "Subscriber's email address",
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
      description: "Subscriber's phone number",
      required: false,
    }),
    avatar: Property.ShortText({
      displayName: 'Avatar URL',
      description: "URL for the subscriber's avatar",
      required: false,
    }),
  },
  async run(context) {
    const { subscriber_id, email, first_name, last_name, phone, avatar } =
      context.propsValue;

    const body: Record<string, unknown> = {
      subscriberId: subscriber_id,
    };
    if (email) body['email'] = email;
    if (first_name) body['firstName'] = first_name;
    if (last_name) body['lastName'] = last_name;
    if (phone) body['phone'] = phone;
    if (avatar) body['avatar'] = avatar;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.novu.co/v1/subscribers',
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
