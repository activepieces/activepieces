import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { KlaviyoProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoUnsubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_unsubscribe_profile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe a profile from email or SMS marketing.',
  props: {
    list_id: KlaviyoProps.listId,
    email: KlaviyoProps.email,
    phone_number: KlaviyoProps.phoneNumber,
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      description: 'The channel to unsubscribe the profile from.',
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

    const attributes: Record<string, unknown> = {};
    if (email) attributes.email = email;
    if (phone_number) attributes.phone_number = phone_number;

    const unsubscriptions: string[] = [];
    if (channel === 'email' || channel === 'both') unsubscriptions.push('email');
    if (channel === 'sms' || channel === 'both') unsubscriptions.push('sms');

    return await klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/profile-subscription-bulk-delete-jobs',
      body: {
        data: {
          type: 'profile-subscription-bulk-delete-job',
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
