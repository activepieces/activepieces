import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const findCountryAction = createAction({
  auth: bexioAuth,
  name: 'find_country',
  displayName: 'Find Country',
  description: 'Search for countries using various criteria',
  props: {
    search_criteria: Property.Array({
      displayName: 'Search Criteria',
      description: 'Search criteria for finding countries',
      required: true,
      properties: {
        field: Property.StaticDropdown({
          displayName: 'Search Field',
          description: 'Field to search in',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'Country Name', value: 'name' },
              { label: 'Country Code (Short)', value: 'name_short' },
            ],
          },
        }),
        value: Property.ShortText({
          displayName: 'Search Value',
          description: 'Value to search for',
          required: true,
        }),
        criteria: Property.StaticDropdown({
          displayName: 'Criteria',
          description: 'Search criteria type',
          required: false,
          defaultValue: 'like',
          options: {
            disabled: false,
            options: [
              { label: 'Contains (like)', value: 'like' },
              { label: 'Exact match (=)', value: '=' },
              { label: 'Exact match (equal)', value: 'equal' },
              { label: 'Not equal (!=)', value: '!=' },
              { label: 'Not equal (not_equal)', value: 'not_equal' },
              { label: 'Greater than (>)', value: '>' },
              { label: 'Greater than (greater_than)', value: 'greater_than' },
              { label: 'Greater or equal (>=)', value: '>=' },
              { label: 'Greater or equal (greater_equal)', value: 'greater_equal' },
              { label: 'Less than (<)', value: '<' },
              { label: 'Less than (less_than)', value: 'less_than' },
              { label: 'Less or equal (<=)', value: '<=' },
              { label: 'Less or equal (less_equal)', value: 'less_equal' },
              { label: 'Does not contain (not_like)', value: 'not_like' },
              { label: 'Is NULL', value: 'is_null' },
              { label: 'Is not NULL', value: 'not_null' },
              { label: 'In (array)', value: 'in' },
              { label: 'Not in (array)', value: 'not_in' },
            ],
          },
        }),
      },
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Field to order results by',
      required: false,
      defaultValue: 'id',
      options: {
        disabled: false,
        options: [
          { label: 'ID', value: 'id' },
          { label: 'Country Name', value: 'name' },
          { label: 'Country Code', value: 'name_short' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (max 2000)',
      required: false,
      defaultValue: 500,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of results to skip',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new BexioClient(auth);
    const searchCriteria = propsValue['search_criteria'] as Array<Record<string, unknown>>;
    const orderBy = propsValue['order_by'] as string | undefined;
    const limit = propsValue['limit'] as number | undefined;
    const offset = propsValue['offset'] as number | undefined;

    const searchBody = searchCriteria.map((criteria) => ({
      field: criteria['field'] as string,
      value: criteria['value'] as string,
      criteria: (criteria['criteria'] as string) || 'like',
    }));

    const queryParams: Record<string, string> = {};
    if (orderBy) {
      queryParams['order_by'] = orderBy;
    }
    if (limit !== undefined) {
      queryParams['limit'] = limit.toString();
    }
    if (offset !== undefined) {
      queryParams['offset'] = offset.toString();
    }

    const response = await client.post<Array<{
      id: number;
      name: string;
      name_short: string;
      iso3166_alpha2: string;
    }>>('/2.0/country/search', searchBody, queryParams);

    return response;
  },
});

