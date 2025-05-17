import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../auth';
import { pollingHelper } from '../common/polling';

export const newCustomerCreated = createTrigger({
  name: 'new_customer_created',
  displayName: 'New Customer Created',
  description: 'Triggers when a new customer is created in QuickBooks',
  type: TriggerStrategy.POLLING,
  auth: quickbooksAuth,
  props: {
    max_results: Property.Number({
      displayName: 'Maximum Number of Customers',
      description: 'Maximum number of customers to return on each poll (default: 10, max: 1000)',
      required: false,
      defaultValue: 10,
    }),
    active_only: Property.Checkbox({
      displayName: 'Active Customers Only',
      description: 'If checked, only active customers will trigger the flow',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {
    "Id": "123",
    "SyncToken": "0",
    "MetaData": {
      "CreateTime": "2023-01-01T12:00:00Z",
      "LastUpdatedTime": "2023-01-01T12:00:00Z"
    },
    "DisplayName": "John Doe",
    "Title": "Mr.",
    "GivenName": "John",
    "MiddleName": "",
    "FamilyName": "Doe",
    "Suffix": "",
    "PrimaryPhone": {
      "FreeFormNumber": "555-555-5555"
    },
    "PrimaryEmailAddr": {
      "Address": "john.doe@example.com"
    },
    "BillAddr": {
      "Line1": "123 Main St",
      "City": "Anytown",
      "CountrySubDivisionCode": "CA",
      "PostalCode": "12345",
      "Country": "USA"
    },
    "Active": true
  },
  
  async onEnable(context) {
    await pollingHelper.onEnable(context);
  },
  
  async onDisable(context) {
    await pollingHelper.onDisable(context);
  },
  
  async run(context) {
    const { max_results, active_only } = context.propsValue;
    
    const customers = await pollingHelper.poll(context, {
      entityName: 'customer',
      queryFilter: active_only ? 'Active = true' : undefined,
      orderBy: 'MetaData.LastUpdatedTime DESC',
      maxResults: max_results || 10,
    });
    
    return customers;
  },
});
