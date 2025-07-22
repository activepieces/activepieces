import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findSubscriber = createAction({
  auth: smooveAuth,
  name: 'findSubscriber',
  displayName: 'Find Subscriber',
  description: 'Search for subscribers by unique identifiers (ID, email, phone, external ID) or name',
  props: {
    searchType: Property.StaticDropdown({
      displayName: 'Search Type',
      description: 'Choose how to search for subscribers',
      required: true,
      defaultValue: 'identifier',
      options: {
        options: [
          { label: 'By Identifier (ID, Email, Phone, External ID)', value: 'identifier' },
          { label: 'By Name (First Name, Last Name)', value: 'name' },
          { label: 'All Active Contacts (with pagination)', value: 'all' }
        ]
      }
    }),
    
    id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique ID of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the contact',
      required: false,
    }),
    cellphone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The phone number of the contact (cellphone)',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'The external ID of the contact',
      required: false,
    }),
    
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Search by first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Search by last name',
      required: false,
    }),
    
    fields: Property.ShortText({
      displayName: 'Fields to Return',
      description: 'Comma-separated list of fields to return (e.g., id,email,firstName,lastName). Leave empty for all fields.',
      required: false,
    }),
    includeCustomFields: Property.Checkbox({
      displayName: 'Include Custom Fields',
      description: 'Include custom fields in the response',
      required: false,
      defaultValue: false,
    }),
    includeLinkedLists: Property.Checkbox({
      displayName: 'Include Linked Lists',
      description: 'Include linked lists in the response',
      required: false,
      defaultValue: false,
    }),
    
    skip: Property.Number({
      displayName: 'Skip Records',
      description: 'Number of records to skip (for pagination, default: 0)',
      required: false,
      defaultValue: 0,
    }),
    take: Property.Number({
      displayName: 'Max Records',
      description: 'Maximum number of records to return (default: 100, max: 100)',
      required: false,
      defaultValue: 100,
    }),
    
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort the results by a specific field',
      required: false,
      defaultValue: '-id',
      options: {
        options: [
          { label: 'ID (Newest First)', value: '-id' },
          { label: 'ID (Oldest First)', value: 'id' },
          { label: 'Email (A-Z)', value: 'email' },
          { label: 'Email (Z-A)', value: '-email' },
          { label: 'First Name (A-Z)', value: 'firstName' },
          { label: 'First Name (Z-A)', value: '-firstName' },
          { label: 'Last Changed (Newest)', value: '-lastChanged' },
          { label: 'Last Changed (Oldest)', value: 'lastChanged' },
          { label: 'Signup Date (Newest)', value: '-timestampSignup' },
          { label: 'Signup Date (Oldest)', value: 'timestampSignup' }
        ]
      }
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      searchType, id, email, cellphone, externalId, firstName, lastName,
      fields, includeCustomFields, includeLinkedLists, skip, take, sort 
    } = propsValue;

    const queryParams: string[] = [];
    
    if (searchType === 'identifier') {
      if (!id && !email && !cellphone && !externalId) {
        throw new Error('For identifier search, please provide at least one: Contact ID, Email, Phone, or External ID');
      }
      
      if (id) queryParams.push(`id=${encodeURIComponent(id)}`);
      if (email) queryParams.push(`email=${encodeURIComponent(email)}`);
      if (cellphone) queryParams.push(`cellphone=${encodeURIComponent(cellphone)}`);
      if (externalId) queryParams.push(`externalid=${encodeURIComponent(externalId)}`);
    } else if (searchType === 'name') {
      if (!firstName && !lastName) {
        throw new Error('For name search, please provide First Name and/or Last Name');
      }
      
      if (firstName) queryParams.push(`firstname=${encodeURIComponent(firstName)}`);
      if (lastName) queryParams.push(`lastname=${encodeURIComponent(lastName)}`);
    }
    
    if (fields && fields.trim()) {
      queryParams.push(`fields=${encodeURIComponent(fields.trim())}`);
    }
    if (includeCustomFields) queryParams.push('includeCustomFields=true');
    if (includeLinkedLists) queryParams.push('includeLinkedLists=true');
    
    const skipValue = Math.max(0, skip || 0);
    const takeValue = Math.min(Math.max(1, take || 100), 100);
    queryParams.push(`skip=${skipValue}`);
    queryParams.push(`take=${takeValue}`);
    
    if (sort) queryParams.push(`sort=${encodeURIComponent(sort)}`);
    
    const endpoint = `/Contacts?${queryParams.join('&')}`;

    try {
      const response = await makeRequest(auth, HttpMethod.GET, endpoint);
      
      if (!response) {
        return {
          success: false,
          message: 'No response from server',
          data: [],
          total: 0
        };
      }
      
      const contacts = Array.isArray(response) ? response : [response];
      
      return {
        success: true,
        message: `Found ${contacts.length} contact(s)`,
        data: contacts,
        total: contacts.length,
        searchType,
        pagination: {
          skip: skipValue,
          take: takeValue,
          returned: contacts.length
        }
      };
      
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        return {
          success: false,
          message: 'No contacts found matching the provided criteria',
          data: [],
          total: 0,
          searchType
        };
      }
      
      throw error;
    }
  },
});
