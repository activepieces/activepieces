import { createAction, Property } from '@activepieces/pieces-framework';
import { servicenowAuth } from '../../auth';
import { callServiceNowApi, getServiceNowTables, ServiceNowApiResponse, ServiceNowRecord } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findRecord = createAction({
  auth: servicenowAuth,
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Lookup a record in a specific table using query parameters',
  props: {
    table: Property.Dropdown({
      displayName: 'Table',
      description: 'Select the ServiceNow table to search in',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const tables = await getServiceNowTables(auth);
          return {
            disabled: false,
            options: tables.map(table => ({
              label: table,
              value: table,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Error loading tables'
          };
        }
      },
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'ServiceNow encoded query string (e.g., "state=1^priority=2")',
      required: true,
    }),
    fields: Property.ShortText({
      displayName: 'Fields (optional)',
      description: 'Comma-separated list of fields to retrieve (leave empty for all fields)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of records to return',
      required: false,
      defaultValue: 10,
    }),
    orderBy: Property.ShortText({
      displayName: 'Order By (optional)',
      description: 'Field to order results by (e.g., "sys_created_on")',
      required: false,
    }),
  },
  async run(context) {
    const { table, query, fields, limit, orderBy } = context.propsValue;
    const auth = context.auth as any;

    try {
      const queryParams: Record<string, string> = {
        sysparm_query: query,
        sysparm_limit: (limit || 10).toString(),
      };

      if (fields) {
        queryParams.sysparm_fields = fields;
      }

      if (orderBy) {
        queryParams.sysparm_orderby = orderBy;
      }

      const response = await callServiceNowApi<ServiceNowApiResponse<ServiceNowRecord[]>>(
        HttpMethod.GET,
        auth,
        `/table/${table}`,
        undefined,
        queryParams
      );

      return {
        records: response.result || [],
        count: response.result?.length || 0,
      };
    } catch (error) {
      console.error('Error finding records:', error);
      throw error;
    }
  },
});
