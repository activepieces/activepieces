import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getCustomers = createAction({
  auth: housecallProAuth,
  name: 'get_customers',
  displayName: 'Get Customers',
  description: 'Retrieves a list of customers from Housecall Pro.',
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts from 1)',
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of customers per page (max 100)',
      required: false,
      defaultValue: 50,
    }),
    q: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search customers by name, email, mobile number, and address',
      required: false,
    }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: 'Expand',
      description: 'Expand related data',
      required: false,
      options: {
        options: [
          { label: 'Attachments', value: 'attachments' },
          { label: 'Do Not Service', value: 'do_not_service' },
        ],
      },
    }),
    location_ids: Property.Array({
      displayName: 'Location IDs',
      description: 'IDs of locations from which to pull customers',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'The customer attribute by which to sort the results',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Last Name', value: 'last_name' },
        ],
      },
    }),
    sort_direction: Property.StaticDropdown({
      displayName: 'Sort Direction',
      description: 'The order of sorting (ascending or descending)',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },

  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      page: (propsValue.page || 1).toString(),
      page_size: (propsValue.page_size || 50).toString(),
    };

    if (propsValue.q) {
      queryParams['q'] = propsValue.q;
    }

    if (propsValue.expand && propsValue.expand.length > 0) {
      queryParams['expand'] = propsValue.expand.join(',');
    }

    if (propsValue.location_ids && propsValue.location_ids.length > 0) {
      queryParams['location_ids'] = (propsValue.location_ids as string[]).join(',');
    }

    if (propsValue.sort_by) {
      queryParams['sort_by'] = propsValue.sort_by;
    }

    if (propsValue.sort_direction) {
      queryParams['sort_direction'] = propsValue.sort_direction;
    }

    const response = await makeHousecallProRequest(
      auth,
      '/customers',
      HttpMethod.GET,
      undefined,
      queryParams
    );

    return response.body;
  },
});
