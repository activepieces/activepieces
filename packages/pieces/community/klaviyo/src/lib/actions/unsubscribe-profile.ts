import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const unsubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribe_profile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribes a profile from email and/or SMS marketing in Klaviyo.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the Klaviyo list to unsubscribe the profile from.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile to unsubscribe.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number to unsubscribe from SMS (E.164 format).',
      required: false,
    }),
  },
  async run(context) {
    const { list_id, email, phone_number } = context.propsValue;

    const profileAttributes: Record<string, unknown> = {};
    if (email) profileAttributes['email'] = email;
    if (phone_number) profileAttributes['phone_number'] = phone_number;

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.POST,
      apiKey: context.auth,
      path: '/profile-suppression-bulk-create-jobs',
      body: {
        data: {
          type: 'profile-suppression-bulk-create-job',
          attributes: {
            list_id,
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
      },
    });
    return result;
  },
});
