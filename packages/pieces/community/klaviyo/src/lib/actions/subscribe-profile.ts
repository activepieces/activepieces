import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const subscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'subscribe_profile',
  displayName: 'Subscribe Profile',
  description: 'Subscribes a profile to email and/or SMS marketing in Klaviyo.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the Klaviyo list to subscribe the profile to.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile to subscribe.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number for SMS subscription (E.164 format).',
      required: false,
    }),
    subscribe_email: Property.Checkbox({
      displayName: 'Subscribe to Email',
      required: false,
      defaultValue: true,
    }),
    subscribe_sms: Property.Checkbox({
      displayName: 'Subscribe to SMS',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { list_id, email, phone_number, subscribe_email, subscribe_sms } =
      context.propsValue;

    const subscriptions: Record<string, unknown> = {};
    if (subscribe_email) {
      subscriptions['email'] = { marketing: { consent: 'SUBSCRIBED' } };
    }
    if (subscribe_sms) {
      subscriptions['sms'] = { marketing: { consent: 'SUBSCRIBED' } };
    }

    const profileAttributes: Record<string, unknown> = {};
    if (email) profileAttributes['email'] = email;
    if (phone_number) profileAttributes['phone_number'] = phone_number;

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.POST,
      apiKey: context.auth,
      path: '/profile-subscription-bulk-create-jobs',
      body: {
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            list_id,
            subscriptions: [
              {
                channels: subscriptions,
                profile: {
                  data: {
                    type: 'profile',
                    attributes: profileAttributes,
                  },
                },
              },
            ],
          },
        },
      },
    });
    return result;
  },
});
