import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';

export const findLead = createAction({
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Find a lead in Kommo by ID, name, or other criteria',
  auth: kommoAuth,
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'How to search for the lead',
      required: true,
      options: {
        options: [
          { label: 'Lead ID', value: 'id' },
          { label: 'Lead Name', value: 'name' },
          { label: 'Custom Query', value: 'query' },
        ],
      },
      defaultValue: 'id',
    }),
    lead_id: Property.Number({
      displayName: 'Lead ID',
      description: 'The ID of the lead to find',
      required: false,
      defaultValue: 0,
    }),
    lead_name: Property.ShortText({
      displayName: 'Lead Name',
      description: 'The name of the lead to find',
      required: false,
    }),
    custom_query: Property.Object({
      displayName: 'Custom Query',
      description: 'Custom query parameters for searching leads',
      required: false,
    }),
    with_contacts: Property.Checkbox({
      displayName: 'Include Contacts',
      description: 'Include contact information in the response',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = getAccessTokenOrThrow(auth);
    const { search_type, lead_id, lead_name, custom_query, with_contacts } = propsValue;

    let endpoint = 'leads';
    let queryParams: Record<string, any> = {};

    // Add 'with' parameter if contacts are requested
    if (with_contacts) {
      queryParams.with = 'contacts';
    }

    // Handle different search types
    if (search_type === 'id' && lead_id) {
      endpoint = `leads/${lead_id}`;
    } else if (search_type === 'name' && lead_name) {
      queryParams.query = lead_name;
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
