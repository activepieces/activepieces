import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { servicenowAuth, makeServiceNowRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const newRecordTrigger = createTrigger({
  auth: servicenowAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a specified ServiceNow table',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The ServiceNow table to monitor (e.g., incident, change_request, cmdb_ci)',
      required: true,
    }),
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. Copy the webhook URL below
2. Go to your ServiceNow instance
3. Navigate to **System Webhooks** → **Outbound**
4. Create a new outbound webhook with the following settings:
   - **Name**: New Record - [Table Name]
   - **Table**: [The table you specified above]
   - **When**: Insert
   - **URL**: [Paste the webhook URL here]
   - **Authentication Type**: Basic Auth
5. Test the webhook configuration
6. Save and activate

The trigger will now fire whenever a new record is created in the specified table.
      `,
    }),
  },
  async onEnable(context) {
    await context.store.put('webhookUrl', context.webhookUrl);
    await context.store.put('table', context.propsValue.table);
  },
  async onDisable(context) {
    await context.store.delete('webhookUrl');
    await context.store.delete('table');
  },
  async run(context) {
    const payload:any = context.payload.body;
    return [payload.record || payload];
  },
  async test(context) {
    const table = context.propsValue?.table;
    
    if (!table) {
      return {
        sys_id: 'test123',
        number: 'TEST0001',
        short_description: 'Test record',
        state: '1',
        created_on: new Date().toISOString(),
      };
    }
    
    try {
      const response = await makeServiceNowRequest(
        context.auth,
        `/table/${table}?sysparm_limit=1&sysparm_exclude_reference_link=true`,
        HttpMethod.GET
      );
      return response.body.result || [];
    } catch (error) {
      return [];
    }
  },
  sampleData: {
    sys_id: '123abc456def789ghi',
    number: 'INC0001234',
    short_description: 'Sample incident',
    description: 'A detailed description of the incident',
    state: '1',
    priority: '3',
    assignment_group: 'IT Support',
    assigned_to: 'Jane Doe',
    created_on: '2024-01-15T10:30:00',
    updated_on: '2024-01-15T10:30:00',
  },
});
