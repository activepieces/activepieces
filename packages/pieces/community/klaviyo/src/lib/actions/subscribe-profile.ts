import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { KlaviyoProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoSubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_subscribe_profile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe a profile to email or SMS marketing.',
  props: {
    list_id: KlaviyoProps.listId,
    email: KlaviyoProps.email,
    phone_number: KlaviyoProps.phoneNumber,
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      description: 'The channel to subscribe the profile to.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'email' },
          { label: 'SMS', value: 'sms' },
          { label: 'Both', value: 'both' },
        ],
      },
    }),
  },
  async run(context) {
    const { list_id, email, phone_number, channel } = context.propsValue;

    const subscriptions: Record<string, { marketing: { consent: string } }> = {};
    if (channel === 'email' || channel === 'both') {
      subscriptions.email = { marketing: { consent: 'SUBSCRIBED' } };
    }
    if (channel === 'sms' || channel === 'both') {
      subscriptions.sms = { marketing: { consent: 'SUBSCRIBED' } };
    }

    const attributes: Record<string, unknown> = { subscriptions };
    if (email) attributes.email = email;
    if (phone_number) attributes.phone_number = phone_number;

    return await klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/profile-subscription-bulk-create-jobs',
      body: {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes,
                },
              ],
            },
          },
          relationships: {
            list: {
              data: { type: 'list', id: list_id },
            },
          },
        },
      },
    });
  },
});
