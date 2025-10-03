import {
  createTrigger,
  Property,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { insightlyAuth } from '../common/common';

export const newRecord = createTrigger({
  auth: insightlyAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Fires when a new record is created in Insightly',
  type: TriggerStrategy.POLLING,
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true,
      defaultValue: 'na1'
    }),
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor for new records',
      required: true,
      options: {
        options: [
          { label: 'Contact', value: 'Contacts' },
          { label: 'Lead', value: 'Leads' },
          { label: 'Opportunity', value: 'Opportunities' },
          { label: 'Organization', value: 'Organisations' },
          { label: 'Project', value: 'Projects' },
          { label: 'Task', value: 'Tasks' },
          { label: 'Event', value: 'Events' },
          { label: 'Note', value: 'Notes' },
          { label: 'Product', value: 'Products' },
          { label: 'Quote', value: 'Quotation' }
        ]
      }
    })
  },
  async onEnable(context) {
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete('lastPollTime');
  },
  async run(context) {
    const { pod, objectType } = context.propsValue;
    const apiKey = context.auth;
    const lastPollTime = await context.store.get<string>('lastPollTime');

    const lastPollDate = lastPollTime
      ? new Date(lastPollTime)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Use the correct endpoint for each object type
    let endpoint = objectType;
    if (objectType === 'Products') {
      endpoint = 'Product';
    } else if (objectType === 'Quotation') {
      endpoint = 'Quotation';
    }

    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${endpoint}?brief=false&count_total=false&top=100`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        headers: {
          'Content-Type': 'application/json'
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: ''
        }
      });

      await context.store.put('lastPollTime', new Date().toISOString());

      const records = Array.isArray(response.body) ? response.body : [];

      const newRecords = records.filter((record: any) => {
        const dateStr = record.DATE_CREATED_UTC || record.CREATED_DATE_UTC || record.DATE_CREATED;
        if (!dateStr) return false;
        
        // Handle both "2025-10-02 08:21:11" and "2025-10-03T17:53:38.953Z" formats
        const createdDate = new Date(dateStr.includes('T') ? dateStr : dateStr + 'Z');
        return createdDate > lastPollDate;
      });

      return newRecords;
    } catch (error: any) {
      throw new Error(`Failed to fetch new records: ${error.message}`);
    }
  },
  async test(context) {
    const { pod, objectType } = context.propsValue;
    const apiKey = context.auth;

    // Use the correct endpoint for each object type
    let endpoint = objectType;
    if (objectType === 'Products') {
      endpoint = 'Product';
    } else if (objectType === 'Quotation') {
      endpoint = 'Quotation';
    }

    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const url = `${baseUrl}/${endpoint}?top=1`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        headers: {
          'Content-Type': 'application/json'
        },
        authentication: {
          type: AuthenticationType.BASIC,
          username: apiKey,
          password: ''
        }
      });

      return Array.isArray(response.body) ? response.body : [];
    } catch (error: any) {
      throw new Error(`Failed to test trigger: ${error.message}`);
    }
  },
  sampleData: {
    RECORD_ID: 123456,
    RECORD_NAME: 'Sample Contact',
    OWNER_USER_ID: 789,
    DATE_CREATED_UTC: '2025-10-02T09:53:54.704Z',
    VISIBLE_TO: 'Everyone',
    VISIBLE_TEAM_ID: 0,
    CUSTOMFIELDS: [
      {
        FIELD_NAME: 'CUSTOM_FIELD_1',
        FIELD_VALUE: 'Sample Value'
      }
    ]
  }
});
