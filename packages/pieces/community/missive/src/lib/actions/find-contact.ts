import { createAction, Property } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const findContactAction = createAction({
  auth: missiveAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Search for a contact by email, name, or contact book',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the specific contact to get (if provided, other search parameters will be ignored)',
      required: false,
    }),
    contactBookId: Property.ShortText({
      displayName: 'Contact Book ID',
      description: 'Contact book ID to search within (required for searching contacts)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Search for contact by email address',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Search for contact by name (first name, last name, or full name)',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search Term',
      description: 'General search term to find contacts (searches across name, email, phone, organization, notes, etc.)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of contacts returned (max value: 200)',
      required: false,
      defaultValue: 50,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'How to order the results',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Last Name', value: 'last_name' },
          { label: 'Last Modified', value: 'last_modified' },
        ],
      },
    }),
  },
  async run(context) {
    const { 
      contactId, 
      contactBookId, 
      email,
      name,
      search, 
      limit, 
      order
    } = context.propsValue;
    
    const apiToken = context.auth.apiToken;

    let endpoint = '/contacts';
    const params = new URLSearchParams();

    // If contact ID is provided, get specific contact
    if (contactId) {
      endpoint = `/contacts/${contactId}`;
    } else {
      // Always include contact_book parameter (required by API)
      params.append('contact_book', contactBookId);

      // Build search parameters based on provided fields
      if (email) {
        params.append('email', email);
      } else if (name) {
        params.append('name', name);
      } else if (search) {
        params.append('search', search);
      }

      // Add optional parameters
      if (order) params.append('order', order);
      if (limit) params.append('limit', limit.toString());

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }

    const response = await missiveApiCall(apiToken, endpoint);

    return response;
  },
}); 