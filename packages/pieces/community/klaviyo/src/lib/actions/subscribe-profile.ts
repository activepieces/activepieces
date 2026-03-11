import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const subscribeProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'subscribe_profile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe a profile to email or SMS communications.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The list ID to subscribe the profile to (required for email subscriptions)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to subscribe (required for email subscription)',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (required for SMS subscription)',
      required: false,
    }),
    consent_email: Property.StaticDropdown({
      displayName: 'Email Consent',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'SUBSCRIBED' },
          { label: 'Never Subscribed', value: 'NEVER_SUBSCRIBED' },
        ],
      },
    }),
    consent_sms: Property.StaticDropdown({
      displayName: 'SMS Consent',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'SUBSCRIBED' },
          { label: 'Never Subscribed', value: 'NEVER_SUBSCRIBED' },
        ],
      },
    }),
  },
  async run(context) {
    const { list_id, email, phone_number, consent_email, consent_sms } =
      context.propsValue;

    if (!email && !phone_number) {
      throw new Error('Provide at least an email or phone number.');
    }

    const profileAttributes: Record<string, unknown> = {};
    if (email) profileAttributes['email'] = email;
    if (phone_number) profileAttributes['phone_number'] = phone_number;

    const subscriptions: Record<string, unknown> = {};
    if (email && consent_email) {
      subscriptions['email'] = { marketing: { consent: consent_email } };
    }
    if (phone_number && consent_sms) {
      subscriptions['sms'] = { marketing: { consent: consent_sms } };
    }
    profileAttributes['subscriptions'] = subscriptions;

    const payload: Record<string, unknown> = {
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
      },
    };

    if (list_id) {
      (payload['data'] as Record<string, unknown>)['relationships'] = {
        list: { data: { type: 'list', id: list_id } },
      };
    }

    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/profile-subscription-bulk-create-jobs',
      body: payload,
    });
  },
});
