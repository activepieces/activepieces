import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const findProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'find_profile',
  displayName: 'Find Profile',
  description: 'Find a profile by email or phone number',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Field to search by',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The email or phone number to search for',
      required: true,
    }),
  },
  async run(context) {
    const { searchBy, searchValue } = context.propsValue;

    if (searchBy === 'email') {
      return await klaviyoClient.findProfileByEmail(
        context.auth,
        searchValue
      );
    } else {
      return await klaviyoClient.findProfileByPhone(
        context.auth,
        searchValue
      );
    }
  },
});
