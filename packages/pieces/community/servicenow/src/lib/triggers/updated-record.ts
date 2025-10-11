import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { servicenowAuth } from '../../auth';
import { callServiceNowApi, getServiceNowTables, ServiceNowApiResponse, ServiceNowRecord } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updatedRecord = createTrigger({
  auth: servicenowAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Triggers when an existing record in a table is updated',
  props: {
    table: Property.Dropdown({
      displayName: 'Table',
      description: 'Select the ServiceNow table to monitor',
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
    pollInterval: Property.Number({
      displayName: 'Poll Interval (seconds)',
      description: 'How often to check for updated records',
      required: false,
      defaultValue: 60,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    sys_id: '1234567890abcdef1234567890abcdef',
    number: 'INC0010001',
    short_description: 'Updated incident',
    description: 'This incident has been updated',
    state: '2',
    priority: '2',
    sys_created_on: '2024-01-01 12:00:00',
    sys_updated_on: '2024-01-01 13:30:00',
    sys_created_by: 'admin',
    sys_updated_by: 'user1',
  },
  onEnable: async (context) => {
    const { table } = context.propsValue;
    const auth = context.auth as any;
    
    // Store the last check time
    const lastCheck = new Date();
    await context.store.put('lastUpdateCheck', lastCheck.toISOString());
    
    return {
      table,
      lastCheck: lastCheck.toISOString(),
    };
  },
  onDisable: async (context) => {
    // Clean up any stored data if needed
    await context.store.delete('lastUpdateCheck');
  },
  run: async (context) => {
    const { table } = context.propsValue;
    const auth = context.auth as any;
    
    // Get the last check time
    const lastCheckStr = await context.store.get('lastUpdateCheck') as string;
    const lastCheck = new Date(lastCheckStr);
    
    try {
      // Query for records updated after the last check
      const queryParams = {
        sysparm_query: `sys_updated_on>${lastCheck.toISOString().replace('T', ' ').replace('Z', '')}`,
        sysparm_limit: '100',
        sysparm_orderby: 'sys_updated_on',
      };

      const response = await callServiceNowApi<ServiceNowApiResponse<ServiceNowRecord[]>>(
        HttpMethod.GET,
        auth,
        `/table/${table}`,
        undefined,
        queryParams
      );

      // Update the last check time
      const newLastCheck = new Date();
      await context.store.put('lastUpdateCheck', newLastCheck.toISOString());

      return response.result || [];
    } catch (error) {
      console.error('Error polling for updated records:', error);
      return [];
    }
  },
});
