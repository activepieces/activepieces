import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const findProfile = createAction({
  auth: klaviyoAuth,
  name: 'find_profile',
  displayName: 'Find Profile by Email/Phone',
  description: 'Locate a profile using email address or phone number.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for.',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format to search for.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const filters: string[] = [];
    if (propsValue.email) {
      filters.push(`equals(email,"${propsValue.email}")`);
    }
    if (propsValue.phoneNumber) {
      filters.push(`equals(phone_number,"${propsValue.phoneNumber}")`);
    }
    const filterString =
      filters.length > 1 ? `or(${filters.join(',')})` : filters[0] ?? '';

    return await klaviyoApiCall(auth as string, HttpMethod.GET, '/profiles', undefined, {
      filter: filterString,
    });
  },
});
