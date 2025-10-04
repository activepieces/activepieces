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

// Helper function to get the correct ID field for each object type
function getRecordId(record: any, objectType: string): number {
  switch (objectType) {
    case 'Contacts':
      return record.CONTACT_ID;
    case 'Leads':
      return record.LEAD_ID;
    case 'Opportunities':
      return record.OPPORTUNITY_ID;
    case 'Organisations':
      return record.ORGANISATION_ID;
    case 'Projects':
      return record.PROJECT_ID;
    case 'Tasks':
      return record.TASK_ID;
    case 'Events':
      return record.EVENT_ID;
    case 'Notes':
      return record.NOTE_ID;
    case 'Products':
      return record.PRODUCT_ID;
    case 'Quotation':
      return record.QUOTE_ID;
    default:
      return record.RECORD_ID || record.ID;
  }
}

export const newRecord = createTrigger({
  auth: insightlyAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Fires when a new record is created in Insightly',
  type: TriggerStrategy.POLLING,
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description:
        'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
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
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description:
        'Maximum number of records to fetch per polling cycle (1-500)',
      required: false,
      defaultValue: 100
    })
  },
  onEnable: async (context) => {
    // Initialize the last poll time for this trigger
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  onDisable: async (context) => {
    // Clean up stored state
    await context.store.delete('lastPollTime');
  },
  run: async (context) => {
    const { pod, objectType, maxRecords = 100 } = context.propsValue;
    const apiKey = context.auth;
    const lastPollTime = await context.store.get<string>('lastPollTime');

    const lastPollDate = lastPollTime
      ? new Date(lastPollTime)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago

    // Use the correct endpoint for each object type
    let endpoint = objectType;
    if (objectType === 'Products') {
      endpoint = 'Product';
    } else if (objectType === 'Quotation') {
      endpoint = 'Quotation';
    }

    const baseUrl = `https://api.${pod}.insightly.com/v3.1`;
    const limitedRecords = Math.min(Math.max(maxRecords, 1), 500);

    // Add updated_after parameter to get recently created/updated records
    const lastPollIso = lastPollDate.toISOString();
    const url = `${baseUrl}/${endpoint}?brief=false&count_total=false&top=${limitedRecords}&updated_after=${encodeURIComponent(
      lastPollIso
    )}`;

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

      const records = Array.isArray(response.body) ? response.body : [];

      // Filter for truly new records (created after last poll)
      const newRecords = records
        .filter((record: any) => {
          const dateStr =
            record.DATE_CREATED_UTC ||
            record.CREATED_DATE_UTC ||
            record.DATE_CREATED;
          if (!dateStr) return false;

          // Handle both "2025-10-02 08:21:11" and "2025-10-03T17:53:38.953Z" formats
          const createdDate = new Date(
            dateStr.includes('T') ? dateStr : dateStr + 'Z'
          );
          return createdDate > lastPollDate;
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(
            a.DATE_CREATED_UTC || a.CREATED_DATE_UTC || a.DATE_CREATED || 0
          );
          const dateB = new Date(
            b.DATE_CREATED_UTC || b.CREATED_DATE_UTC || b.DATE_CREATED || 0
          );
          return dateB.getTime() - dateA.getTime();
        });

      // Update the last poll time
      await context.store.put('lastPollTime', new Date().toISOString());

      return newRecords;
    } catch (error: any) {
      throw new Error(`Failed to fetch new records: ${error.message}`);
    }
  },
  test: async (context) => {
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
    const url = `${baseUrl}/${endpoint}?top=50&brief=false`;

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

      const records = Array.isArray(response.body) ? response.body : [];

      // Sort by creation date (newest first) and return top 5
      return records
        .sort((a: any, b: any) => {
          const dateA = new Date(
            a.DATE_CREATED_UTC || a.CREATED_DATE_UTC || a.DATE_CREATED || 0
          );
          const dateB = new Date(
            b.DATE_CREATED_UTC || b.CREATED_DATE_UTC || b.DATE_CREATED || 0
          );
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);
    } catch (error: any) {
      throw new Error(`Failed to test trigger: ${error.message}`);
    }
  },
  sampleData: {
    CONTACT_ID: 123456,
    FIRST_NAME: 'John',
    LAST_NAME: 'Doe',
    EMAIL_ADDRESS: 'john.doe@example.com',
    OWNER_USER_ID: 789,
    DATE_CREATED_UTC: '2025-10-03T23:29:42.815Z',
    DATE_UPDATED_UTC: '2025-10-03T23:29:42.815Z',
    PHONE: '+1-555-0123',
    TITLE: 'Sales Manager',
    ORGANISATION_ID: 456,
    CUSTOMFIELDS: [
      {
        FIELD_NAME: 'LEAD_SOURCE',
        FIELD_VALUE: 'Website'
      }
    ],
    TAGS: [
      {
        TAG_NAME: 'VIP Customer'
      }
    ]
  }
});
