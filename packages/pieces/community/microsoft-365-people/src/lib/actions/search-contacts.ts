import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365PeopleAuth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/common';

export const searchContacts = createAction({
  auth: microsoft365PeopleAuth,
  name: 'searchContacts',
  displayName: 'Search Contacts',
  description: 'Find contacts by name, email, or other properties.',
  audience: 'both',
  aiMetadata: { description: 'Searches the authenticated user\'s Microsoft 365 People (Outlook) contacts and returns those matching a free-text search term across fields like name and email. Use to find a contact (e.g. to obtain its ID) before updating or deleting it; the search term is required. Read-only and idempotent.', idempotent: true },
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
