import { createAction, Property } from '@activepieces/pieces-framework';
import { servicenowAuth } from '../../auth';
import { callServiceNowApi, getServiceNowTables, ServiceNowApiResponse, ServiceNowRecord } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateRecord = createAction({
  auth: servicenowAuth,
  name: 'update_record',
  displayName: 'Update Record',
  description: 'Update an existing record\'s fields (by ID or filter)',
  props: {
    table: Property.Dropdown({
      displayName: 'Table',
      description: 'Select the ServiceNow table to update a record in',
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
      description: 'The sys_id of the record to update',
      required: true,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'JSON object containing the field values to update',
      required: true,
      defaultValue: {},
    }),
  },
  async run(context) {
    const { table, recordId, fields } = context.propsValue;
    const auth = context.auth as any;

    try {
      const response = await callServiceNowApi<ServiceNowApiResponse<ServiceNowRecord>>(
        HttpMethod.PUT,
        auth,
        `/table/${table}/${recordId}`,
        fields
      );

      return response.result;
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  },
});
