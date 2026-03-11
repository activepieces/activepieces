import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const findProfileByEmailAction = createAction({
  auth: klaviyoAuth,
  name: 'find_profile_by_email',
  displayName: 'Find Profile by Email / Phone',
  description: 'Find a profile using email address or phone number.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +15005550006)',
      required: false,
    }),
  },
  async run(context) {
    const { email, phone_number } = context.propsValue;

    if (!email && !phone_number) {
      throw new Error('Provide at least an email or phone number.');
    }

    const filter = email
      ? `equals(email,"${email}")`
      : `equals(phone_number,"${phone_number}")`;

    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/profiles',
      queryParams: { filter },
    });
  },
});
