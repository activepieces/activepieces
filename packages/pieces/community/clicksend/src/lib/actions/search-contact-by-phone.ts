import { createAction, Property } from '@activepieces/pieces-framework';
import { clicksendAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { listIdDropdown } from '../common/props';

export const searchContactByPhone = createAction({
  auth: clicksendAuth,
  name: 'searchContactByPhone',
  displayName: 'Search Contact by Phone',
  description: 'Search for a contact in a ClickSend contact list by phone number',
  props: {
    list_id: listIdDropdown,
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number to search for (can be partial match)',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Records per Page',
      description: 'Number of records per page (default: 50, max: 100)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { username, password } = auth;
    const apiKey = `${username}:${password}`;

    // Get all contacts from the specified list
    const queryParams: Record<string, any> = {};
    
    if (propsValue['page']) {
      queryParams['page'] = propsValue['page'];
    }
    if (propsValue['limit']) {
      queryParams['limit'] = propsValue['limit'];
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/lists/${propsValue.list_id}/contacts`,
      queryParams
    );

    // Ensure response.data.data is an array
    const contacts = Array.isArray(response.data.data) ? response.data.data : [];
    
    // Filter contacts by phone number
    const searchPhone = propsValue.phone_number.toLowerCase();
    const matchingContacts = contacts.filter((contact: any) => {
      if (contact.phone_number) {
        return contact.phone_number.toLowerCase().includes(searchPhone);
      }
      return false;
    });

    return {
      success: true,
      message: `Found ${matchingContacts.length} contact(s) with phone number containing "${propsValue.phone_number}"`,
      total_contacts: contacts.length,
      matching_contacts: matchingContacts.length,
      contacts: matchingContacts,
      all_contacts: contacts,
    };
  },
});
