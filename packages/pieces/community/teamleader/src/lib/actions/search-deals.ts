import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchDeals = createAction({
  auth: teamleaderAuth,
  name: 'searchDeals',
  displayName: 'Search Deals',
  description: 'Search for deals in Teamleader',
  props: {
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search by deal title or reference',
      required: false,
    }),
    phase: Property.ShortText({
      displayName: 'Phase ID',
      description: 'Filter deals by phase',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'Filter deals by company',
      required: false,
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Filter deals by contact person',
      required: false,
    }),
    updatedSince: Property.DateTime({
      displayName: 'Updated Since',
      description: 'Filter deals updated since a specific date',
      required: false,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort the results by a specific field',
      required: false,
      options: {
        options: [
          { label: 'Title', value: 'title' },
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Expected Closing Date', value: 'expected_closing_date' },
          { label: 'Probability', value: 'probability' },
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

    // Build filter object
    const filter: Record<string, unknown> = {};
    if (propsValue.term) {
      filter['term'] = propsValue.term;
    }
    if (propsValue.phase) {
      filter['phase_id'] = propsValue.phase;
    }
    if (propsValue.companyId) {
      filter['company_id'] = propsValue.companyId;
    }
    if (propsValue.contactId) {
      filter['contact_id'] = propsValue.contactId;
    }
    if (propsValue.updatedSince) {
      filter['updated_since'] = propsValue.updatedSince;
    }

    // Only add filter if there are filter conditions
    if (Object.keys(filter).length > 0) {
      requestBody['filter'] = filter;
    }

    // Add sorting if specified
    if (propsValue.sortBy) {
      requestBody['sort'] = [{
        field: propsValue.sortBy,
        order: propsValue.sortOrder || 'asc',
      }];
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/deals.list',
      requestBody
    );

    return response;
  },
});