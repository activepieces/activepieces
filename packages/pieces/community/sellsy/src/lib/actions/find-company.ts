import { createAction, Property } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCompany = createAction({
  auth: sellsyAuth,
  name: 'findCompany',
  displayName: 'Find Company',
  description: 'Search for companies in Sellsy',
  props: {
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'Search term to find companies by name or other fields',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Search companies by name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search companies by email address',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Company Type',
      description: 'Filter by company type',
      required: false,
      options: {
        options: [
          { label: 'Prospect', value: 'prospect' },
          { label: 'Client', value: 'client' },
          { label: 'Supplier', value: 'supplier' },
        ],
      },
    }),
    is_archived: Property.Checkbox({
      displayName: 'Is Archived',
      description: 'Filter by archived status',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Field to order results by',
      required: false,
      defaultValue: 'id',
      options: {
        options: [
          { label: 'ID', value: 'id' },
          { label: 'Name', value: 'name' },
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Order Direction',
      description: 'Direction to order results',
      required: false,
      defaultValue: 'asc',
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of companies to return (0-100)',
      required: false,
      defaultValue: 25,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of companies to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Build filters object
    const filters: any = {};
    
    if (propsValue.search_term) {
      filters.search = propsValue.search_term;
    }
    if (propsValue.name) {
      filters.name = propsValue.name;
    }
    if (propsValue.email) {
      filters.email = propsValue.email;
    }
    if (propsValue.type) {
      filters.type = propsValue.type;
    }
    if (propsValue.is_archived !== undefined) {
      filters.is_archived = propsValue.is_archived;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (propsValue.order) {
      queryParams.append('order', propsValue.order);
    }
    if (propsValue.direction) {
      queryParams.append('direction', propsValue.direction);
    }
    if (propsValue.limit !== undefined) {
      queryParams.append('limit', propsValue.limit.toString());
    }
    if (propsValue.offset !== undefined) {
      queryParams.append('offset', propsValue.offset.toString());
    }

    const queryString = queryParams.toString();
    const path = `/companies/search${queryString ? `?${queryString}` : ''}`;

    const requestBody = {
      filters: filters,
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      path,
      requestBody
    );

    return response;
  },
});