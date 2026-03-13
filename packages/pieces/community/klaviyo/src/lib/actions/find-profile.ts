import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

export const findProfile = createAction({
  auth: klaviyoAuth,
  name: 'find_profile',
  displayName: 'Find Profile by Email / Phone',
  description: 'Searches for a Klaviyo profile by email address or phone number.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number to search for (E.164 format).',
      required: false,
    }),
  },
  async run(context) {
    const { email, phone_number } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (email) {
      queryParams['filter'] = `equals(email,"${email}")`;
    } else if (phone_number) {
      queryParams['filter'] = `equals(phone_number,"${phone_number}")`;
    }

    const result = await klaviyoApiCall<unknown>({
      method: HttpMethod.GET,
      apiKey: context.auth,
      path: '/profiles',
      queryParams,
    });
    return result;
  },
});
