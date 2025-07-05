import { createAction, Property } from '@activepieces/pieces-framework';
import { clicksendAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { listIdDropdown } from '../common/props';

export const searchContactByEmail = createAction({
  auth: clicksendAuth,
  name: 'searchContactByEmail',
  displayName: 'Search Contact by Email',
  description: 'Search for a contact in a ClickSend contact list by email address',
  props: {
    list_id: listIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address to search for',
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
    // Filter contacts by email address
    const searchEmail = propsValue.email.toLowerCase();
    const matchingContacts = contacts.filter((contact: any) => {
      if (contact.email) {
        return contact.email.toLowerCase().includes(searchEmail);
      }
      return false;
    });

    return {
      success: true,
      message: `Found ${matchingContacts.length} contact(s) with email containing "${propsValue.email}"`,
      total_contacts: contacts.length,
      matching_contacts: matchingContacts.length,
      contacts: matchingContacts,
      all_contacts: contacts,
    };
  },
});
