import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall, klaviyoCommon } from '../../common';

export const subscribeProfile = createAction({
  name: 'subscribe_profile',
  auth: klaviyoAuth,
  displayName: 'Subscribe Profile',
  description: 'Subscribe a profile to email or SMS marketing.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g. +15551234567)',
      required: false,
    }),
    list: klaviyoCommon.lists,
    channels: Property.StaticMultiSelectDropdown({
      displayName: 'Channels',
      description: 'Which channels to subscribe the profile to.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'EMAIL' },
          { label: 'SMS', value: 'SMS' },
        ],
      },
    }),
  },
  async run(context) {
    const { email, phoneNumber, list, channels } = context.propsValue;

    const subscriptions: Record<string, { marketing: { consent: string } }> = {};
    if (channels.includes('EMAIL')) {
      subscriptions['email'] = { marketing: { consent: 'SUBSCRIBED' } };
    }
    if (channels.includes('SMS')) {
      subscriptions['sms'] = { marketing: { consent: 'SUBSCRIBED' } };
    }

    const profileAttributes: Record<string, unknown> = { subscriptions };
    if (email) profileAttributes['email'] = email;
    if (phoneNumber) profileAttributes['phone_number'] = phoneNumber;

    const response = await klaviyoApiCall(
      HttpMethod.POST,
      'profile-subscription-bulk-create-jobs',
      context.auth.secret_text,
      {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: profileAttributes,
                },
              ],
            },
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: list,
              },
            },
          },
        },
      }
    );
    return response.body;
  },
});
