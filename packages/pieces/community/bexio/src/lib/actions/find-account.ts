import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const findAccountAction = createAction({
  auth: bexioAuth,
  name: 'find_account',
  displayName: 'Find Account',
  description: 'Search for accounts using various criteria',
  props: {
    search_criteria: Property.Array({
      displayName: 'Search Criteria',
      description: 'Search criteria for finding accounts',
      required: true,
      properties: {
        field: Property.StaticDropdown({
          displayName: 'Search Field',
          description: 'Field to search in',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'Account Number', value: 'account_no' },
              { label: 'Account Name', value: 'name' },
              { label: 'Account Type', value: 'account_type' },
              { label: 'Account Group ID', value: 'fibu_account_group_id' },
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
            ],
          },
        }),
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
    const limit = propsValue['limit'] as number | undefined;
    const offset = propsValue['offset'] as number | undefined;

    const searchBody = searchCriteria.map((criteria) => ({
      field: criteria['field'] as string,
      value: criteria['value'] as string,
      criteria: (criteria['criteria'] as string) || 'like',
    }));

    const queryParams: Record<string, string> = {};
    if (limit !== undefined) {
      queryParams['limit'] = limit.toString();
    }
    if (offset !== undefined) {
      queryParams['offset'] = offset.toString();
    }

    const response = await client.post<Array<{
      id: number;
      uuid: string;
      account_no: string;
      name: string;
      account_type: number;
      tax_id?: number;
      fibu_account_group_id?: number;
      is_active: boolean;
      is_locked: boolean;
    }>>('/2.0/accounts/search', searchBody, queryParams);

    return response;
  },
});

