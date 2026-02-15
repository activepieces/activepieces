import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoFindProfileByEmailOrPhone = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_find_profile',
  displayName: 'Find Profile by Email/Phone',
  description: 'Locate a profile using email or phone number.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by email address.',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Search by phone number (E.164 format).',
      required: false,
    }),
  },
  async run(context) {
    const { email, phone_number } = context.propsValue;

    let filter = '';
    if (email) {
      filter = `equals(email,"${email}")`;
    } else if (phone_number) {
      filter = `equals(phone_number,"${phone_number}")`;
    } else {
      throw new Error('Either email or phone number must be provided.');
    }

    const response = await klaviyoApiCall<{
      data: unknown[];
    }>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      path: '/profiles',
      queryParams: { filter },
    });

    return response.data.length > 0 ? response.data[0] : null;
  },
});
