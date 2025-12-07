import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const subscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'subscribe_profile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe a profile to email or SMS marketing',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to subscribe',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +12025551234)',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to subscribe to',
      required: true,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      description: 'The channel to subscribe to',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'SMS', value: 'sms' },
        ],
      },
    }),
  },
  async run(context) {
    const { email, phone_number, list_id, channel } = context.propsValue;

    if (!email && !phone_number) {
      throw new Error('Either email or phone_number is required');
    }

    const profiles = [];
    const profileData: any = {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: 'Activepieces Integration',
        profiles: [],
      },
      relationships: {
        list: {
          data: {
            type: 'list',
            id: list_id,
          },
        },
      },
    };

    const profile: any = {
      data: {
        type: 'profile',
        attributes: {},
      },
      subscriptions: [
        {
          channels: {
            [channel]: [channel === 'email' ? 'MARKETING' : 'SMS'],
          },
        },
      ],
    };

    if (email) profile.data.attributes.email = email;
    if (phone_number) profile.data.attributes.phone_number = phone_number;

    profileData.attributes.profiles = [profile];

    const response = await klaviyoCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/profile-subscription-bulk-create-jobs',
      { data: profileData }
    );

    return response.body;
  },
});
