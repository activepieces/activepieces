import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const unsubscribeProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribe_profile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe a profile from email or SMS communications.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'Optional list ID to unsubscribe from (leave empty to unsubscribe globally)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format',
      required: false,
    }),
  },
  async run(context) {
    const { list_id, email, phone_number } = context.propsValue;

    if (!email && !phone_number) {
      throw new Error('Provide at least an email or phone number.');
    }

    const profileAttributes: Record<string, unknown> = {};
    if (email) profileAttributes['email'] = email;
    if (phone_number) profileAttributes['phone_number'] = phone_number;

    const payload: Record<string, unknown> = {
      data: {
        type: 'profile-suppression-bulk-create-job',
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
      endpoint: '/profile-suppression-bulk-create-jobs',
      body: payload,
    });
  },
});
