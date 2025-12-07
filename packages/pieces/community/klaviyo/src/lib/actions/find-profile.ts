import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findProfile = createAction({
  auth: klaviyoAuth,
  name: 'find_profile',
  displayName: 'Find Profile by Email or Phone',
  description: 'Search for a profile using email address or phone number',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number to search for (E.164 format)',
      required: false,
    }),
  },
  async run(context) {
    const { email, phone_number } = context.propsValue;

    if (!email && !phone_number) {
      throw new Error('Either email or phone_number is required');
    }

    let filter = '';
    if (email) {
      filter = `equals(email,"${email}")`;
    } else if (phone_number) {
      filter = `equals(phone_number,"${phone_number}")`;
    }

    const response = await klaviyoCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      `/profiles?filter=${encodeURIComponent(filter)}`
    );

    const profiles = response.body.data || [];

    return {
      found: profiles.length > 0,
      count: profiles.length,
      profiles,
    };
  },
});
