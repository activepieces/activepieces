import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const searchOrderAction = createAction({
  auth: bexioAuth,
  name: 'search_order',
  displayName: 'Search Order',
  description: 'Search for orders using various criteria',
  props: {
    search_criteria: Property.Array({
      displayName: 'Search Criteria',
      description: 'Search criteria for finding orders',
      required: true,
      properties: {
        field: Property.StaticDropdown({
          displayName: 'Search Field',
          description: 'Field to search in',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'ID', value: 'id' },
              { label: 'Status ID', value: 'kb_item_status_id' },
              { label: 'Document Number', value: 'document_nr' },
              { label: 'Title', value: 'title' },
              { label: 'Contact ID', value: 'contact_id' },
              { label: 'Sub Contact ID', value: 'contact_sub_id' },
              { label: 'User ID', value: 'user_id' },
              { label: 'Currency ID', value: 'currency_id' },
              { label: 'Total Gross', value: 'total_gross' },
              { label: 'Total Net', value: 'total_net' },
              { label: 'Total', value: 'total' },
              { label: 'Valid From', value: 'is_valid_from' },
              { label: 'Valid To', value: 'is_valid_to' },
              { label: 'Updated At', value: 'updated_at' },
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
          { label: 'Total', value: 'total' },
          { label: 'Total Net', value: 'total_net' },
          { label: 'Total Gross', value: 'total_gross' },
          { label: 'Updated At', value: 'updated_at' },
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
      document_nr: string;
      title: string | null;
      contact_id: number | null;
      contact_sub_id: number | null;
      user_id: number;
      project_id: number | null;
      language_id: number;
      bank_account_id: number;
      currency_id: number;
      payment_type_id: number;
      total_gross: string;
      total_net: string;
      total_taxes: string;
      total: string;
      kb_item_status_id: number;
      is_valid_from: string;
      updated_at: string;
    }>>('/2.0/kb_order/search', searchBody, queryParams);

    return response;
  },
});

