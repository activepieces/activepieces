import { createAction, Property } from '@activepieces/pieces-framework';
import { servicenowAuth } from '../../auth';
import { callServiceNowApi, getServiceNowTables, ServiceNowApiResponse, ServiceNowRecord } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getRecord = createAction({
  auth: servicenowAuth,
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Gets specific table record by sys_id',
  props: {
    table: Property.Dropdown({
      displayName: 'Table',
      description: 'Select the ServiceNow table to get a record from',
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
    recordId: Property.ShortText({
      displayName: 'Record ID (sys_id)',
      description: 'The sys_id of the record to retrieve',
      required: true,
    }),
    fields: Property.ShortText({
      displayName: 'Fields (optional)',
      description: 'Comma-separated list of fields to retrieve (leave empty for all fields)',
      required: false,
    }),
  },
  async run(context) {
    const { table, recordId, fields } = context.propsValue;
    const auth = context.auth as any;

    try {
      const queryParams: Record<string, string> = {};
      if (fields) {
        queryParams.sysparm_fields = fields;
      }

      const response = await callServiceNowApi<ServiceNowApiResponse<ServiceNowRecord>>(
        HttpMethod.GET,
        auth,
        `/table/${table}/${recordId}`,
        undefined,
        queryParams
      );

      return response.result;
    } catch (error) {
      console.error('Error getting record:', error);
      throw error;
    }
  },
});
