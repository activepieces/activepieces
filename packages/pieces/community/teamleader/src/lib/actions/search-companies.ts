import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchCompanies = createAction({
  auth: teamleaderAuth,
  name: 'searchCompanies',
  displayName: 'Search Companies',
  description: 'Search for companies in Teamleader',
  props: {
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search by company name, VAT number, or custom field value',
      required: false,
    }),
    updatedSince: Property.DateTime({
      displayName: 'Updated Since',
      description: 'Filter companies updated since a specific date',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort the results by a specific field',
      required: false,
      options: {
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Added At', value: 'added_at' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Order of the sorted results',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page (max 100)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      page: {
        size: propsValue.pageSize || 20,
        number: propsValue.page || 1,
      },
    };

    if (propsValue.term) {
      requestBody['filter'] = { term: propsValue.term };
    }

    if (propsValue.updatedSince) {
      requestBody['filter'] = {
        ...(requestBody['filter'] || {}),
        updated_since: propsValue.updatedSince,
      };
    }

    if (propsValue.sortBy) {
      requestBody['sort'] = [
        {
          field: propsValue.sortBy,
          order: propsValue.sortOrder || 'asc',
        },
      ];
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/companies.list',
      requestBody
    );

    return response;
  },
});
