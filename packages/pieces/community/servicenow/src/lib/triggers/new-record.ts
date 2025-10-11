import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { servicenowAuth } from '../../auth';
import { callServiceNowApi, getServiceNowTables, ServiceNowApiResponse, ServiceNowRecord } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const newRecord = createTrigger({
  auth: servicenowAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a specified ServiceNow table',
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
      description: 'How often to check for new records',
      required: false,
      defaultValue: 60,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    sys_id: '1234567890abcdef1234567890abcdef',
    number: 'INC0010001',
    short_description: 'Sample incident',
    description: 'This is a sample incident description',
    state: '1',
    priority: '3',
    sys_created_on: '2024-01-01 12:00:00',
    sys_created_by: 'admin',
  },
  onEnable: async (context) => {
    const { table } = context.propsValue;
    const auth = context.auth as any;
    
    // Store the last check time
    const lastCheck = new Date();
    await context.store.put('lastCheck', lastCheck.toISOString());
    
    return {
      table,
      lastCheck: lastCheck.toISOString(),
    };
  },
  onDisable: async (context) => {
    // Clean up any stored data if needed
    await context.store.delete('lastCheck');
  },
  run: async (context) => {
    const { table } = context.propsValue;
    const auth = context.auth as any;
    
    // Get the last check time
    const lastCheckStr = await context.store.get('lastCheck') as string;
    const lastCheck = new Date(lastCheckStr);
    
    try {
      // Query for records created after the last check
      const queryParams = {
        sysparm_query: `sys_created_on>${lastCheck.toISOString().replace('T', ' ').replace('Z', '')}`,
        sysparm_limit: '100',
        sysparm_orderby: 'sys_created_on',
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
      await context.store.put('lastCheck', newLastCheck.toISOString());

      return response.result || [];
    } catch (error) {
      console.error('Error polling for new records:', error);
      return [];
    }
  },
});
