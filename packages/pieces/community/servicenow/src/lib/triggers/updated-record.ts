import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { servicenowAuth, makeServiceNowRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const updatedRecordTrigger = createTrigger({
  auth: servicenowAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Triggers when an existing record in a table is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {
    table: Property.ShortText({
      displayName: 'Table Name',
      description: 'The ServiceNow table to monitor (e.g., incident, change_request)',
      required: true,
    }),
    instructions: Property.MarkDown({
      value: `
## Setup Instructions

1. Copy the webhook URL below
2. Go to your ServiceNow instance
3. Navigate to **System Webhooks** → **Outbound**
4. Create a new outbound webhook with the following settings:
   - **Name**: Updated Record - [Table Name]
   - **Table**: [The table you specified above]
   - **When**: Update
   - **URL**: [Paste the webhook URL here]
   - **Authentication Type**: Basic Auth
5. Optionally, set **Filters** to trigger only on specific field changes
6. Test the webhook configuration
7. Save and activate

The trigger will now fire whenever a record is updated in the specified table.
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
    const table = context.propsValue.table;
    
    try {
      const response = await makeServiceNowRequest(
        context.auth,
        `/table/${table}?sysparm_limit=1&sysparm_exclude_reference_link=true&sysparm_query=ORDERBYDESCsys_updated_on`,
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
    short_description: 'Updated incident',
    state: '2',
    priority: '2',
    status: 'In Progress',
    assignment_group: 'IT Support',
    assigned_to: 'John Smith',
    updated_on: '2024-01-15T11:45:00',
  },
});
