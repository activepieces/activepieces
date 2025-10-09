import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const searchContacts = createAction({
  auth: microsoft365PeopleAuth,
  name: 'searchContacts',
  displayName: 'Search Contacts',
  description: 'Find contacts by name, email, or other properties.',
  props: {
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Find contacts by name, email, or other properties.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { searchValue } = propsValue;

    return microsoft365PeopleCommon.listContacts({ auth, queryParams: {
      $search: `"${searchValue}"`,
    } });
  },
});
