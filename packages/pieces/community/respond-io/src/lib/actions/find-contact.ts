import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respondIoAuth } from '../../';
import { BASE_URL } from '../common';

export const findContact = createAction({
  auth: respondIoAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Search for a contact by email, phone, or ID',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'How to search for the contact',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Contact ID', value: 'id' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for',
      required: true,
    }),
  },
  async run(context) {
    const { searchBy, searchValue } = context.propsValue;
    const { apiKey, workspaceId } = context.auth;

    let url: string;
    
    if (searchBy === 'id') {
      url = `${BASE_URL}/workspaces/${workspaceId}/contacts/${searchValue}`;
    } else {
      url = `${BASE_URL}/workspaces/${workspaceId}/contacts?${searchBy}=${encodeURIComponent(searchValue)}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
}); 