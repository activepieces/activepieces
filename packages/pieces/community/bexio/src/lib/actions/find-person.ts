import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { bexioAuth } from '../../index';
import { BexioClient } from '../common/client';

export const findPersonAction = createAction({
  auth: bexioAuth,
  name: 'find_person',
  displayName: 'Find Person',
  description: 'Search for person contacts using various criteria',
  props: {
    search_criteria: Property.Array({
      displayName: 'Search Criteria',
      description: 'Search criteria for finding persons',
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
              { label: 'First Name (name_1)', value: 'name_1' },
              { label: 'Last Name (name_2)', value: 'name_2' },
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
              { label: 'Fixed Phone', value: 'phone_fixed' },
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
              { label: 'In (array of values)', value: 'in' },
              { label: 'Not In (array of values)', value: 'not_in' },
            ],
          },
        }),
      },
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Field to sort the results by',
      required: false,
      defaultValue: 'id',
      options: {
        disabled: false,
        options: [
          { label: 'ID', value: 'id' },
          { label: 'Contact Number', value: 'nr' },
          { label: 'First Name', value: 'name_1' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
    order_direction: Property.StaticDropdown({
      displayName: 'Order Direction',
      description: 'Sort order',
      required: false,
      defaultValue: 'asc',
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
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
      description: 'Include archived contacts in the search results',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new BexioClient(auth);
    const searchCriteria = propsValue['search_criteria'] as Array<Record<string, unknown>>;
    const orderBy = propsValue['order_by'] as string | undefined;
    const orderDirection = propsValue['order_direction'] as string | undefined;
    const limit = propsValue['limit'] as number | undefined;
    const offset = propsValue['offset'] as number | undefined;
    const showArchived = propsValue['show_archived'] as boolean | undefined;

    const finalSearchBody = [...searchCriteria];

    // Ensure contact_type_id is 2 (person) unless explicitly overridden by user
    const contactTypeCriteriaIndex = finalSearchBody.findIndex(
      (criteria) => criteria['field'] === 'contact_type_id'
    );

    if (contactTypeCriteriaIndex === -1) {
      finalSearchBody.push({
        field: 'contact_type_id',
        value: '2',
        criteria: '=',
      });
    } else if (finalSearchBody[contactTypeCriteriaIndex]['value'] !== '2') {
      // If user provided a different contact_type_id, ensure it's 2 for "Find Person"
      finalSearchBody[contactTypeCriteriaIndex]['value'] = '2';
      finalSearchBody[contactTypeCriteriaIndex]['criteria'] = '=';
    }

    const queryParams: Record<string, string> = {};
    if (orderBy) {
      queryParams['order_by'] = `${orderBy}${orderDirection === 'desc' ? '_desc' : ''}`;
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
      nr?: string | null;
      contact_type_id: number;
      name_1: string;
      name_2?: string | null;
      salutation_id?: number | null;
      salutation_form?: string | null;
      title_id?: number | null;
      birthday?: string | null;
      address?: string | null;
      street_name?: string | null;
      house_number?: string | null;
      address_addition?: string | null;
      postcode?: string | null;
      city?: string | null;
      country_id?: number | null;
      mail?: string | null;
      mail_second?: string | null;
      phone_fixed?: string | null;
      phone_fixed_second?: string | null;
      phone_mobile?: string | null;
      fax?: string | null;
      url?: string | null;
      skype_name?: string | null;
      remarks?: string | null;
      language_id?: number | null;
      is_lead?: boolean;
      contact_group_ids?: string | null;
      contact_branch_ids?: string | null;
      user_id?: number;
      owner_id?: number;
      updated_at?: string;
    }>>('/2.0/contact/search', finalSearchBody, queryParams);

    return response;
  },
});

