import { createAction, Property } from '@activepieces/pieces-framework';
import { veroAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createOrUpdateUser = createAction({
  auth: veroAuth,
  name: 'createOrUpdateUser',
  displayName: 'Create or Update User',
  description:
    'Create a new user profile or update an existing user profile with custom properties',
  props: {
    id: Property.ShortText({
      displayName: 'User ID',
      description: 'The unique identifier of the user',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the user',
      required: true,
    }),
    data: Property.Object({
      displayName: 'User Data',
      description:
        'Custom user properties (e.g., first_name, last_name, timezone). Reserved properties: language, timezone, userAgent',
      required: false,
    }),
    channels: Property.Array({
      displayName: 'Channels',
      description:
        'Device tokens for push notifications and other communication channels',
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: 'Channel',
          description: 'The channel identifier (e.g., push)',
          required: true,
        }),
        address: Property.ShortText({
          displayName: 'Address',
          description:
            'The address for the channel (e.g., UNIQUE_DEVICE_TOKEN)',
          required: true,
        }),
        platform: Property.ShortText({
          displayName: 'Platform',
          description:
            'The platform for push notifications (e.g., iOS, Android)',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { id, email, data, channels } = context.propsValue;

    const payload: any = {
      id,
      email,
    };

    if (data) {
      payload.data = data;
    }

    if (channels && channels.length > 0) {
      payload.channels = channels;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/users/track',
      payload
    );

    return response;
  },
});
