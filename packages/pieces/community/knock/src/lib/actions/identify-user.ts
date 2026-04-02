import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knockAuth } from '../auth';
import { knockApiCall } from '../common/client';

export const identifyUser = createAction({
  auth: knockAuth,
  name: 'identify_user',
  displayName: 'Identify User',
  description: 'Create or update a user in Knock.',
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'A unique identifier for the user in your system.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The user display name.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The user email address.',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g. +14155552671).',
      required: false,
    }),
    avatar: Property.ShortText({
      displayName: 'Avatar URL',
      description: 'URL to the user avatar image.',
      required: false,
    }),
    customProperties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Additional key-value properties to set on the user.',
      required: false,
    }),
  },
  async run(context) {
    const { userId, name, email, phoneNumber, avatar, customProperties } =
      context.propsValue;

    const body: Record<string, unknown> = {};

    // Spread custom properties first so explicit fields always win
    if (customProperties && Object.keys(customProperties).length > 0) {
      Object.assign(body, customProperties);
    }

    if (name) body['name'] = name;
    if (email) body['email'] = email;
    if (phoneNumber) body['phone_number'] = phoneNumber;
    if (avatar) body['avatar'] = avatar;

    return knockApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}`,
      body,
    });
  },
});
