import { createAction, Property } from '@activepieces/pieces-framework';
import { amplitudeAuth } from '../../index';
import { amplitudeIdentify } from '../common';

export const identifyUserAction = createAction({
  auth: amplitudeAuth,
  name: 'identify_user',
  displayName: 'Identify User',
  description: 'Set or update user properties for a user in Amplitude.',
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'A unique identifier for the user. At least one of User ID or Device ID is required.',
      required: false,
    }),
    device_id: Property.ShortText({
      displayName: 'Device ID',
      description: 'A unique identifier for the device. At least one of User ID or Device ID is required.',
      required: false,
    }),
    user_properties: Property.Object({
      displayName: 'User Properties',
      description:
        'Properties to set on the user profile, for example name or plan.',
      required: true,
    }),
  },
  async run(context) {
    const { user_id, device_id, user_properties } = context.propsValue;

    if (!user_id && !device_id) {
      throw new Error('At least one of User ID or Device ID is required.');
    }

    const identification: {
      user_id?: string;
      device_id?: string;
      user_properties: Record<string, unknown>;
    } = {
      user_properties: user_properties as Record<string, unknown>,
    };

    if (user_id) {
      identification.user_id = user_id;
    }
    if (device_id) {
      identification.device_id = device_id;
    }

    return await amplitudeIdentify({
      apiKey: String(context.auth),
      identification: [identification],
    });
  },
});
