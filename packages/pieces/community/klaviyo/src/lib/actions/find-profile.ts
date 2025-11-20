import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';

export const findProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_find_profile',
  displayName: 'Find Profile',
  description: 'Find a profile by email or phone number.',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Email',
            value: 'email',
          },
          {
            label: 'Phone Number',
            value: 'phone',
          },
        ],
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: 'The email address to search for',
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
      description: 'The phone number to search for (E.164 format recommended, e.g., +12345678900)',
    }),
  },
  async run(context) {
    const { searchBy, email, phone } = context.propsValue;

    const client = makeClient(context.auth);

    if (searchBy === 'email') {
      if (!email) {
        throw new Error('Email is required when searching by email');
      }
      const result = await client.searchProfileByEmail(email);
      return result.data.length > 0 ? result.data[0] : null;
    } else {
      if (!phone) {
        throw new Error('Phone number is required when searching by phone');
      }
      const result = await client.searchProfileByPhone(phone);
      return result.data.length > 0 ? result.data[0] : null;
    }
  },
});

