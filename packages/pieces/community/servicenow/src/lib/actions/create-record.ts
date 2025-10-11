import { createAction, Property } from '@activepieces/pieces-framework';
import { servicenowAuth } from '../../auth';
import { callServiceNowApi, getServiceNowTables, ServiceNowApiResponse, ServiceNowRecord } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createRecord = createAction({
  auth: servicenowAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a record in a specified ServiceNow table with provided fields',
  props: {
    table: Property.Dropdown({
      displayName: 'Table',
      description: 'Select the ServiceNow table to create a record in',
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
    fields: Property.Json({
      displayName: 'Fields',
      description: 'JSON object containing the field values for the new record',
      required: true,
      defaultValue: {},
    }),
  },
  async run(context) {
    const { table, fields } = context.propsValue;
    const auth = context.auth as any;

    try {
      const response = await callServiceNowApi<ServiceNowApiResponse<ServiceNowRecord>>(
        HttpMethod.POST,
        auth,
        `/table/${table}`,
        fields
      );

      return response.result;
    } catch (error) {
      console.error('Error creating record:', error);
      throw error;
    }
  },
});
