import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const subscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'subscribe_profile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe a profile to email or SMS lists in Klaviyo.',
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to subscribe the profile to.',
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
    emailConsent: Property.StaticDropdown({
      displayName: 'Email Consent',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'SUBSCRIBED' },
        ],
      },
    }),
    smsConsent: Property.StaticDropdown({
      displayName: 'SMS Consent',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'SUBSCRIBED' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const subscriptions: Record<string, unknown>[] = [];
    const profile: Record<string, unknown> = {};
    if (propsValue.email) profile['email'] = propsValue.email;
    if (propsValue.phoneNumber) profile['phone_number'] = propsValue.phoneNumber;

    const channels: Record<string, unknown> = {};
    if (propsValue.emailConsent) {
      channels['email'] = ['MARKETING'];
    }
    if (propsValue.smsConsent) {
      channels['sms'] = ['MARKETING'];
    }

    subscriptions.push({
      ...profile,
      channels,
    });

    return await klaviyoApiCall(
      auth as string,
      HttpMethod.POST,
      '/profile-subscription-bulk-create-jobs',
      {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: subscriptions.map((sub) => ({
                type: 'profile',
                attributes: sub,
              })),
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
