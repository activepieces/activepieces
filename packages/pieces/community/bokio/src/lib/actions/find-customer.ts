import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCustomer = createAction({
  auth: bokioAuth,
  name: 'findCustomer',
  displayName: 'Find Customer',
  description: 'Find customers in Bokio by filtering and pagination',
  props: {
    filterType: Property.StaticDropdown({
      displayName: 'Filter Type',
      description: 'Type of filter to use',
      required: false,
      options: {
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Type', value: 'type' },
          { label: 'VAT Number', value: 'vatNumber' },
          { label: 'Organization Number', value: 'orgNumber' },
        ],
      },
    }),
    filterValue: Property.ShortText({
      displayName: 'Filter Value',
      description: 'Value to filter by',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (defaults to 1)',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of items per page (max 100, defaults to 25)',
      required: false,
    }),
  },
  async run(context) {
    const { filterType, filterValue, page, pageSize } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    let query = '';
    if (filterType && filterValue) {
      query = `${filterType}=='${filterValue}'`;
    }

    const params = new URLSearchParams();
    if (page !== undefined && page !== null) {
      params.append('page', String(page));
    } else {
      params.append('page', '1');
    }

    if (pageSize !== undefined && pageSize !== null) {
      params.append('pageSize', String(pageSize));
    } else {
      params.append('pageSize', '25');
    }

    if (query) {
      params.append('query', query);
    }

    const url = `/companies/${companyId}/customers?${params.toString()}`;

    const response = await makeRequest(api_key, HttpMethod.GET, url);

    return response;
  },
});
