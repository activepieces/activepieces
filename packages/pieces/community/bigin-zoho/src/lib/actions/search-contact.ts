import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest, BiginApiResponse, BiginContact } from '../common';

export const searchContact = createAction({
  auth: biginZohoAuth,
  name: 'bigin_search_contact',
  displayName: 'Search Contact',
  description: 'Search for contacts by name, email, or phone',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Field to search by',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'Email' },
          { label: 'Phone', value: 'Phone' },
          { label: 'First Name', value: 'First_Name' },
          { label: 'Last Name', value: 'Last_Name' },
          { label: 'Full Name', value: 'Full_Name' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: 'Records Per Page',
      description: 'Number of records per page (max: 200, default: 50)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const {
      searchBy,
      searchValue,
      page = 1,
      perPage = 50,
    } = context.propsValue;

    // Build search parameters
    const searchParams = new URLSearchParams({
      criteria: `(${searchBy}:equals:${searchValue})`,
      page: page.toString(),
      per_page: Math.min(perPage, 200).toString(), // Ensure max limit
    });

    const response = await makeRequest(
      context.auth,
      HttpMethod.GET,
      `/Contacts/search?${searchParams.toString()}`
    );

    return response;
  },
}); 