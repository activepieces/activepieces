import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const findContact = createAction({
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Searches for a contact by name, email, or phone in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search for contacts by name, email, or phone number',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of contacts to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const response = await client.searchContacts(context.propsValue.query);
    
    // Apply limit if specified
    const contacts = response.data.slice(0, context.propsValue.limit || 10);
    
    return {
      contacts,
      total_found: response.data.length,
      query: context.propsValue.query,
    };
  },
}); 