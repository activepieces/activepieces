import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient } from '../common';

export const findContactAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Locate a contact by name, email, or phone',
  props: {
    search_query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description: 'Search by name, email, or phone number',
    }),
  },
  async run(context) {
    const { search_query } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const result = await client.searchContacts(search_query);
    
    return result;
  },
});
