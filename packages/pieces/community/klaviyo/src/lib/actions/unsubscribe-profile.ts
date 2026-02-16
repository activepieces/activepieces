import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribeProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribe-profile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe a profile from email or SMS marketing lists',
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
      description: 'The ID of the list to unsubscribe from',
      required: true,
    }),
    unsubscribe_email: Property.Checkbox({
      displayName: 'Unsubscribe from Email',
      description: 'Unsubscribe this profile from email marketing',
      required: false,
      defaultValue: true,
    }),
    unsubscribe_sms: Property.Checkbox({
      displayName: 'Unsubscribe from SMS',
      description: 'Unsubscribe this profile from SMS marketing',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { email, phone_number, list_id, unsubscribe_email, unsubscribe_sms } = context.propsValue;

    if (!email && !phone_number) {
      throw new Error('Either email or phone_number is required');
    }

    const subscriptions: any = {};
    if (unsubscribe_email) {
      subscriptions.email = { marketing: { consent: 'UNSUBSCRIBED' } };
    }
    if (unsubscribe_sms) {
      subscriptions.sms = { marketing: { consent: 'UNSUBSCRIBED' } };
    }

    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
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
      '/profile-subscription-bulk-delete-jobs/',
      requestBody
    );

    return response;
  },
});
