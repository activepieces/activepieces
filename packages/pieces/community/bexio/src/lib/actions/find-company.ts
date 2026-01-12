import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const findCompanyAction = createAction({
  auth: bexioAuth,
  name: 'find_company',
  displayName: 'Find Company',
  description: 'Search for company contacts using various criteria',
  props: {
    search_criteria: Property.Array({
      displayName: 'Search Criteria',
      description: 'Search criteria for finding companies',
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
              { label: 'Company Name', value: 'name_1' },
              { label: 'Company Addition', value: 'name_2' },
              { label: 'Contact Number', value: 'nr' },
              { label: 'Address', value: 'address' },
              { label: 'Email', value: 'mail' },
              { label: 'Secondary Email', value: 'mail_second' },
              { label: 'Postcode', value: 'postcode' },
              { label: 'City', value: 'city' },
              { label: 'Country ID', value: 'country_id' },
              { label: 'Contact Group IDs', value: 'contact_group_ids' },
              { label: 'Contact Type ID', value: 'contact_type_id' },
              { label: 'Updated At', value: 'updated_at' },
              { label: 'User ID', value: 'user_id' },
              { label: 'Phone', value: 'phone_fixed' },
              { label: 'Mobile Phone', value: 'phone_mobile' },
              { label: 'Fax', value: 'fax' },
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
          { label: 'Contact Number', value: 'nr' },
          { label: 'Company Name', value: 'name_1' },
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
    show_archived: Property.Checkbox({
      displayName: 'Show Archived',
      description: 'Show archived contacts only',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new BexioClient(auth);
    const searchCriteria = propsValue['search_criteria'] as Array<Record<string, unknown>>;
    const orderBy = propsValue['order_by'] as string | undefined;
    const limit = propsValue['limit'] as number | undefined;
    const offset = propsValue['offset'] as number | undefined;
    const showArchived = propsValue['show_archived'] as boolean | undefined;

    const searchBody = searchCriteria.map((criteria) => ({
      field: criteria['field'] as string,
      value: criteria['value'] as string,
      criteria: (criteria['criteria'] as string) || 'like',
    }));

    // Add contact_type_id filter to only return companies if not already specified
    const hasContactTypeFilter = searchCriteria.some(
      (criteria) => (criteria['field'] as string) === 'contact_type_id'
    );
    if (!hasContactTypeFilter) {
      searchBody.push({
        field: 'contact_type_id',
        value: '1',
        criteria: '=',
      });
    }

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
    if (showArchived !== undefined) {
      queryParams['show_archived'] = showArchived.toString();
    }

    const response = await client.post<Array<{
      id: number;
      nr: string | null;
      contact_type_id: number;
      name_1: string;
      name_2: string | null;
      salutation_id: number | null;
      salutation_form: number | null;
      title_id: number | null;
      birthday: string | null;
      address: string | null;
      street_name: string | null;
      house_number: string | null;
      address_addition: string | null;
      postcode: string | null;
      city: string | null;
      country_id: number | null;
      mail: string | null;
      mail_second: string | null;
      phone_fixed: string | null;
      phone_fixed_second: string | null;
      phone_mobile: string | null;
      fax: string | null;
      url: string | null;
      skype_name: string | null;
      remarks: string | null;
      language_id: number | null;
      is_lead: boolean;
      contact_group_ids: string | null;
      contact_branch_ids: string | null;
      user_id: number;
      owner_id: number;
      updated_at: string;
    }>>('/2.0/contact/search', searchBody, queryParams);

    return response;
  },
});

