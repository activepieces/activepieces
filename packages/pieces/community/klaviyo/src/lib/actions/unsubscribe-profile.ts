import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const unsubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribe_profile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe a profile from email or SMS lists in Klaviyo.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to unsubscribe the profile from.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format.',
      required: false,
    }),
    emailUnsubscribe: Property.Checkbox({
      displayName: 'Unsubscribe from Email',
      required: false,
      defaultValue: false,
    }),
    smsUnsubscribe: Property.Checkbox({
      displayName: 'Unsubscribe from SMS',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const profile: Record<string, unknown> = {};
    if (propsValue.email) profile['email'] = propsValue.email;
    if (propsValue.phoneNumber) profile['phone_number'] = propsValue.phoneNumber;

    const channels: Record<string, string[]> = {};
    if (propsValue.emailUnsubscribe) {
      channels['email'] = ['MARKETING'];
    }
    if (propsValue.smsUnsubscribe) {
      channels['sms'] = ['MARKETING'];
    }

    return await klaviyoApiCall(
      auth as string,
      HttpMethod.POST,
      '/profile-subscription-bulk-delete-jobs',
      {
        data: {
          type: 'profile-subscription-bulk-delete-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    ...profile,
                    channels,
                  },
                },
              ],
            },
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: propsValue.listId,
              },
            },
          },
        },
      },
    );
  },
});
