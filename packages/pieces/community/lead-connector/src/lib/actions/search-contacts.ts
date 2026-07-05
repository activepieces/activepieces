import { createAction, Property } from '@activepieces/pieces-framework';
import { getContacts } from '../common';
import { leadConnectorAuth } from '../..';

export const searchContactsAction = createAction({
  auth: leadConnectorAuth,
  name: 'search_contacts',
  displayName: 'Search Contacts',
  description: 'Search for contacts with a search query.',
  audience: 'both',
  aiMetadata: { description: 'Searches contacts in the GoHighLevel/LeadConnector location matching a free-text query (name, email, phone, etc.), returning up to 100 results. Use to look up an existing contact or its ID before another action. Read-only and idempotent.', idempotent: true },
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
