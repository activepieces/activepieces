import { createAction, Property } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const findContactAction = createAction({
  auth: missiveAuth,
  name: 'find_contact',
  displayName: 'Find/Get Contact',
  description: 'Search for contacts by email, name, or contact book, or get a specific contact by ID',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the specific contact to get (if provided, other search parameters will be ignored)',
      required: false,
    }),
    contactBookId: Property.ShortText({
      displayName: 'Contact Book ID',
      description: 'Contact book ID to search within',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search Term',
      description: 'Text string to filter contacts. Search terms are matched against all contact infos: name, email, phone, organization, custom fields, notes, etc.',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Default ordering is by contact last name. To get the most recently updated contacts, pass last_modified',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Last Name', value: 'last_name' },
          { label: 'Last Modified', value: 'last_modified' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of contacts returned (max value: 200)',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Offset used to paginate',
      required: false,
      defaultValue: 0,
    }),
    modifiedSince: Property.Number({
      displayName: 'Modified Since (Unix Timestamp)',
      description: 'To return only contacts that have been modified or created since a point in time, pass a Unix Epoch time',
      required: false,
    }),
    includeDeleted: Property.Checkbox({
      displayName: 'Include Deleted',
      description: 'To include deleted contacts in the results of modified_since requests, pass true. Only the contact id and deleted attributes will be returned since the contact data has been deleted from Missive.',
      required: false,
    }),
    // Legacy search parameters (kept for backward compatibility)
    email: Property.ShortText({
      displayName: 'Email (Legacy)',
      description: 'Search for contact by email address (legacy parameter)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name (Legacy)',
      description: 'Search for contact by name (legacy parameter)',
      required: false,
    }),
  },
  async run(context) {
    const { 
      contactId, 
      contactBookId, 
      search, 
      order, 
      limit, 
      offset, 
      modifiedSince, 
      includeDeleted,
      email,
      name
    } = context.propsValue;
    
    const apiToken = context.auth.apiToken;

    let endpoint = '/contacts';
    const params = new URLSearchParams();

    // If contact ID is provided, get specific contact
    if (contactId) {
      endpoint = `/contacts/${contactId}`;
    } else {
      // Use new API parameters
      if (contactBookId) params.append('contact_book', contactBookId);
      if (search) params.append('search', search);
      if (order) params.append('order', order);
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      if (modifiedSince) params.append('modified_since', modifiedSince.toString());
      if (includeDeleted !== undefined) params.append('include_deleted', includeDeleted.toString());
      
      // Legacy parameters (for backward compatibility)
      if (email) params.append('email', email);
      if (name) params.append('name', name);

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }

    const response = await missiveApiCall(apiToken, endpoint);

    return response;
  },
}); 