import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';

export const searchPipeline = createAction({
  auth: biginZohoAuth,
  name: 'bigin_search_pipeline',
  displayName: 'Search Pipeline Record',
  description: 'Search for deals by deal name',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Field to search by',
      required: true,
      options: {
        options: [
          { label: 'Deal Name', value: 'Deal_Name' },
          { label: 'Stage', value: 'Stage' },
          { label: 'Type', value: 'Type' },
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
      per_page: Math.min(perPage, 200).toString(),
    });

    const response = await makeRequest(
      context.auth,
      HttpMethod.GET,
      `/Deals/search?${searchParams.toString()}`
    );

    return response;
  },
}); 