import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const findContact = createAction({
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Locate a contact by ID, name, email, or phone',
  props: {
    // Search method
    search_method: Property.StaticDropdown({
      displayName: 'Search Method',
      description: 'How to search for the contact',
      required: true,
      options: {
        options: [
          { label: 'By Contact ID', value: 'id' },
          { label: 'By Name', value: 'name' },
          { label: 'By Email', value: 'email' },
          { label: 'By Phone', value: 'phone' }
        ]
      }
    }),
    
    // Search by ID
    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'The unique ID of the contact to retrieve',
      required: false
    }),
    
    // Search by name
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name to search for',
      required: false
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name to search for',
      required: false
    }),
    
    // Search by email
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to search for',
      required: false
    }),
    
    // Search by phone
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number to search for',
      required: false
    }),
    
    // Search options
    exact_match: Property.Checkbox({
      displayName: 'Exact Match Only',
      description: 'For name searches, require exact match (otherwise partial matches are returned)',
      required: false,
      defaultValue: false
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of contacts to return (for searches that may return multiple results)',
      required: false,
      defaultValue: 10
    })
  },
  
  async run(context) {
    const { auth, propsValue } = context;
    
    if (!auth) {
      throw new Error('Authentication is required');
    }
    
    const accessToken = (auth as any).access_token;
    if (!accessToken) {
      throw new Error('Access token not found in authentication');
    }
    
    let url = 'https://api.crmworkspace.com/v1/contacts';
    let searchParams: any = {};
    
    // Handle different search methods
    switch (propsValue.search_method) {
      case 'id':
        if (!propsValue.contact_id) {
          throw new Error('Contact ID is required when searching by ID');
        }
        url = `https://api.crmworkspace.com/v1/contacts/${propsValue.contact_id}`;
        break;
        
      case 'name':
        if (!propsValue.first_name && !propsValue.last_name) {
          throw new Error('At least first name or last name is required when searching by name');
        }
        if (propsValue.first_name) searchParams.first_name = propsValue.first_name;
        if (propsValue.last_name) searchParams.last_name = propsValue.last_name;
        if (propsValue.exact_match) searchParams.exact_match = 'true';
        break;
        
      case 'email':
        if (!propsValue.email) {
          throw new Error('Email address is required when searching by email');
        }
        searchParams.email = propsValue.email;
        break;
        
      case 'phone':
        if (!propsValue.phone) {
          throw new Error('Phone number is required when searching by phone');
        }
        searchParams.phone = propsValue.phone;
        break;
        
      default:
        throw new Error('Invalid search method');
    }
    
    // Add limit for list searches
    if (propsValue.search_method !== 'id' && propsValue.limit) {
      searchParams.limit = propsValue.limit;
    }
    
    // Build query string for list searches
    if (propsValue.search_method !== 'id' && Object.keys(searchParams).length > 0) {
      const queryString = new URLSearchParams(searchParams).toString();
      url += `?${queryString}`;
    }
    
    // Make the API request
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: url,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken
        },
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.status >= 400) {
        if (response.status === 404) {
          throw new Error('Contact not found');
        }
        throw new Error(`Wealthbox API error: ${response.status} - ${JSON.stringify(response.body)}`);
      }
      
      // For ID searches, return the single contact
      if (propsValue.search_method === 'id') {
        return {
          found: true,
          contact: response.body,
          total_results: 1
        };
      }
      
      // For other searches, handle the list response
      const contacts = Array.isArray(response.body) ? response.body : [response.body];
      
      return {
        found: contacts.length > 0,
        contacts: contacts,
        total_results: contacts.length,
        // Return first contact for convenience
        contact: contacts.length > 0 ? contacts[0] : null
      };
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('Contact not found')) {
        return {
          found: false,
          contact: null,
          contacts: [],
          total_results: 0,
          message: 'No contact found matching the search criteria'
        };
      }
      throw new Error(`Failed to find contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
});