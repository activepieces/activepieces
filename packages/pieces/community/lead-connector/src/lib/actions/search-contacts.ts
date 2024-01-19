import { createAction, Property } from '@activepieces/pieces-framework';
import { getContacts } from '../common';
import { leadConnectorAuth } from '../..';

export const searchContactsAction = createAction({
  auth: leadConnectorAuth,
  name: 'search_contacts',
  displayName: 'Search Contacts',
  description: 'Search for contacts with a search query.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The value you want to search for.',
      required: true,
    }),
  },

  async run({ auth, propsValue }) {
    const { query } = propsValue;

    return await getContacts(auth, {
      query: query,
    });
  },
});
