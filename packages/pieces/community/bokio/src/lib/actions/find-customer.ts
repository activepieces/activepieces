import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioClient } from '../common/client';
import { bokioSchemas } from '../common/schemas';

export const findCustomer = createAction({
  auth: bokioAuth,
  name: 'findCustomer',
  classification: 'SEARCH',
  displayName: 'Find Customer',
  description: 'Find customers in Bokio by filtering and pagination',
  audience: 'both',
  aiMetadata: { description: 'Lists customers in a Bokio company, one page at a time, optionally filtered by name, type, VAT number or organization number. Match is equals (exact, default) or contains (case-insensitive substring). Leave the filter empty to list all customers. Returns items plus totalItems, totalPages and currentPage; pageSize is 1 to 100. Use it to find a customer id. Read-only.', idempotent: true },
  outputSchema: bokioSchemas.customerPage,
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
    operator: Property.StaticDropdown({
      displayName: 'Match',
      description: 'equals = exact match (default); contains = case-insensitive substring match',
      required: false,
      options: {
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Contains', value: 'contains' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (defaults to 1)',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Results per page, 1 to 100 (defaults to 25)',
      required: false,
    }),
  },
  async run(context) {
    const { filterType, filterValue, operator, page, pageSize } = context.propsValue;
    const query =
      filterType && filterValue
        ? bokioClient.buildFilter([
            {
              field: filterType,
              operator: operator === 'contains' ? '~' : '==',
              value: filterValue,
            },
          ])
        : undefined;
    const body = await bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/customers',
      operation: 'find customers',
      queryParams: bokioClient.listParams({ page, pageSize, query }),
    });
    return bokioClient.normalizePage<unknown>(body);
  },
});
