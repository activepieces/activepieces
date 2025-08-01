import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';
import { 
  phoneProperty, 
  emailProperty, 
  validateEmail, 
  validatePhoneNumber,
  formatPhoneNumber 
} from '../common/utils';

export const findContactAction = createAction({
  auth: respondIoAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Search for a contact by phone number, email, or contact ID',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Choose how to search for the contact',
      required: true,
      options: {
        options: [
          { label: 'Phone Number', value: 'phone' },
          { label: 'Email', value: 'email' },
          { label: 'Contact ID', value: 'id' }
        ]
      }
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in international format (e.g., +1234567890)',
      required: false
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique identifier of the contact',
      required: false
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of contacts to return (default: 10, max: 100)',
      required: false,
      defaultValue: 10
    })
  },
  async run(context) {
    const { searchBy, phone, email, contactId, limit } = context.propsValue;
    const client = new RespondIoClient(context.auth);

    try {
      let searchParams: any = {
        limit: Math.min(limit || 10, 100)
      };

      // Validate and set search parameters based on search type
      switch (searchBy) {
        case 'phone':
          if (!phone) {
            throw new Error('Phone number is required when searching by phone');
          }
          if (!validatePhoneNumber(phone)) {
            throw new Error('Invalid phone number format. Please use international format (e.g., +1234567890)');
          }
          searchParams.phone = formatPhoneNumber(phone);
          break;

        case 'email':
          if (!email) {
            throw new Error('Email is required when searching by email');
          }
          if (!validateEmail(email)) {
            throw new Error('Invalid email format');
          }
          searchParams.email = email.toLowerCase();
          break;

        case 'id':
          if (!contactId) {
            throw new Error('Contact ID is required when searching by ID');
          }
          // For ID search, we'll use the direct get contact endpoint
          const contact = await client.getContact(contactId);
          return {
            contacts: [contact],
            total: 1,
            searchBy: 'id',
            searchValue: contactId
          };

        default:
          throw new Error('Invalid search type');
      }

      // Search for contacts
      const response = await client.searchContacts(searchParams);

      return {
        contacts: response.data || [],
        total: response.total || 0,
        searchBy,
        searchValue: searchBy === 'phone' ? phone : email,
        limit: searchParams.limit
      };

    } catch (error: any) {
      throw new Error(`Failed to find contact: ${error.message}`);
    }
  }
});
