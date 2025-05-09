import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';

export const findContact = createAction({
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Find a contact in Kommo by ID, email, phone, or other criteria',
  auth: kommoAuth,
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'How to search for the contact',
      required: true,
      options: {
        options: [
          { label: 'Contact ID', value: 'id' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Name', value: 'name' },
          { label: 'Custom Query', value: 'query' },
        ],
      },
      defaultValue: 'id',
    }),
    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to find',
      required: false,
      defaultValue: 0,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact to find',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the contact to find',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the contact to find',
      required: false,
    }),
    custom_query: Property.Object({
      displayName: 'Custom Query',
      description: 'Custom query parameters for searching contacts',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = getAccessTokenOrThrow(auth);
    const { search_type, contact_id, email, phone, name, custom_query } = propsValue;

    let endpoint = 'contacts';
    let queryParams: Record<string, any> = {};

    // Handle different search types
    if (search_type === 'id' && contact_id) {
      endpoint = `contacts/${contact_id}`;
    } else if (search_type === 'email' && email) {
      queryParams.query = email;
    } else if (search_type === 'phone' && phone) {
      queryParams.query = phone;
    } else if (search_type === 'name' && name) {
      queryParams.query = name;
    } else if (search_type === 'query' && custom_query) {
      queryParams = { ...queryParams, ...custom_query };
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, endpoint),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams,
    });

    return response.body;
  },
});
