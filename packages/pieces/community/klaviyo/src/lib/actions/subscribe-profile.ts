import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const subscribeProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'subscribe-profile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe a profile to email or SMS marketing lists',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +12345678901)',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to subscribe to',
      required: true,
    }),
    subscribe_to_email: Property.Checkbox({
      displayName: 'Subscribe to Email',
      description: 'Subscribe this profile to email marketing',
      required: false,
      defaultValue: true,
    }),
    subscribe_to_sms: Property.Checkbox({
      displayName: 'Subscribe to SMS',
      description: 'Subscribe this profile to SMS marketing',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { email, phone_number, list_id, subscribe_to_email, subscribe_to_sms } = context.propsValue;

    if (!email && !phone_number) {
      throw new Error('Either email or phone_number is required');
    }

    const subscriptions: any = {};
    if (subscribe_to_email) {
      subscriptions.email = { marketing: { consent: 'SUBSCRIBED' } };
    }
    if (subscribe_to_sms) {
      subscriptions.sms = { marketing: { consent: 'SUBSCRIBED' } };
    }

    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-create-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email,
                  phone_number,
                  subscriptions,
                },
              },
            ],
          },
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: list_id,
            },
          },
        },
      },
    };

    const response = await klaviyoApiRequest(
      context.auth,
      HttpMethod.POST,
      '/profile-subscription-bulk-create-jobs/',
      requestBody
    );

    return response;
  },
});
