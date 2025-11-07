import { createAction, Property } from "@activepieces/pieces-framework";
import { housecallProAuth, makeHousecallProRequest } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getCustomers = createAction({
  auth: housecallProAuth,
  name: 'get_customers',
  displayName: 'Get Customers',
  description: 'Retrieve a list of customers from Housecall Pro.',
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
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search customers by name, email, or phone',
      required: false,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort By',
      required: false,
      options: {
        options: [
          { label: 'Created Date (Newest First)', value: 'created_at_desc' },
          { label: 'Created Date (Oldest First)', value: 'created_at_asc' },
          { label: 'Updated Date (Newest First)', value: 'updated_at_desc' },
          { label: 'Updated Date (Oldest First)', value: 'updated_at_asc' },
          { label: 'Last Name (A-Z)', value: 'last_name_asc' },
          { label: 'Last Name (Z-A)', value: 'last_name_desc' },
        ],
      },
    }),
  },

  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      page: (propsValue.page || 1).toString(),
      page_size: (propsValue.page_size || 50).toString(),
    };

    if (propsValue.search) {
      queryParams['search'] = propsValue.search;
    }

    if (propsValue.sort_by) {
      // Map our friendly names to API parameters
      const sortMapping: Record<string, string> = {
        'created_at_desc': 'created_at',
        'created_at_asc': 'created_at',
        'updated_at_desc': 'updated_at',
        'updated_at_asc': 'updated_at',
        'last_name_asc': 'last_name',
        'last_name_desc': 'last_name',
      };

      const directionMapping: Record<string, string> = {
        'created_at_desc': 'desc',
        'created_at_asc': 'asc',
        'updated_at_desc': 'desc',
        'updated_at_asc': 'asc',
        'last_name_asc': 'asc',
        'last_name_desc': 'desc',
      };

      queryParams['sort_by'] = sortMapping[propsValue.sort_by];
      queryParams['sort_direction'] = directionMapping[propsValue.sort_by];
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
