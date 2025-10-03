import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType
} from '@activepieces/pieces-common';
import { insightlyAuth } from '../common/common';

// Helper function to get the correct ID field for each object type
function getRecordId(record: any, objectType: string): number {
  switch (objectType) {
    case 'Contacts': return record.CONTACT_ID;
    case 'Leads': return record.LEAD_ID;
    case 'Opportunities': return record.OPPORTUNITY_ID;
    case 'Organisations': return record.ORGANISATION_ID;
    case 'Projects': return record.PROJECT_ID;
    case 'Tasks': return record.TASK_ID;
    case 'Events': return record.EVENT_ID;
    case 'Notes': return record.NOTE_ID;
    case 'Products': return record.PRODUCT_ID;
    case 'Quotation': return record.QUOTE_ID;
    default: return record.RECORD_ID || record.ID;
  }
}

// Helper function to create a hash of record data (excluding creation date and ID)
function createRecordHash(record: any, objectType: string): string {
  // Use different fields based on object type
  let hashData: any = {
    OWNER_USER_ID: record.OWNER_USER_ID,
    VISIBLE_TO: record.VISIBLE_TO,
    VISIBLE_TEAM_ID: record.VISIBLE_TEAM_ID,
    CUSTOMFIELDS: record.CUSTOMFIELDS || []
  };

  // Add object-specific fields
  if (objectType === 'Contacts') {
    hashData = {
      ...hashData,
      FIRST_NAME: record.FIRST_NAME,
      LAST_NAME: record.LAST_NAME,
      EMAIL_ADDRESS: record.EMAIL_ADDRESS,
      PHONE: record.PHONE,
      TITLE: record.TITLE
    };
  } else if (objectType === 'Organisations') {
    hashData = {
      ...hashData,
      ORGANISATION_NAME: record.ORGANISATION_NAME,
      PHONE: record.PHONE,
      WEBSITE: record.WEBSITE
    };
  } else {
    hashData.RECORD_NAME = record.RECORD_NAME;
  }

  // Simple hash function using JSON string
  let hash = 0;
  const str = JSON.stringify(hashData);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

export const updatedRecord = createTrigger({
  auth: insightlyAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Fires when an existing record is updated in Insightly',
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
      description: 'The type of Insightly object to monitor for updates',
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
    await context.store.put('record_hashes', {});
  },
  async onDisable(context) {
    await context.store.delete('record_hashes');
  },
  async run(context) {
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

      const records = Array.isArray(response.body) ? response.body : [];
    const storedHashes = await context.store.get<Record<string, { hash: string; lastSeen: number }>>('record_hashes') || {};
    const currentTime = Date.now();
    const updatedRecords: any[] = [];

    for (const record of records) {
      const recordId = getRecordId(record, objectType);
      const recordKey = `${objectType}_${recordId}`;
      const currentHash = createRecordHash(record, objectType);
      const storedRecord = storedHashes[recordKey];

      // Parse date properly (handle both formats)
      let createdDate: Date;
      const dateStr = record.DATE_CREATED_UTC || record.CREATED_DATE_UTC;
      if (dateStr) {
        // Handle both "2025-10-02 08:21:11" and "2025-10-03T17:53:38.953Z" formats
        createdDate = new Date(dateStr.includes('T') ? dateStr : dateStr + 'Z');
      } else {
        createdDate = new Date(0); // Very old date if no creation date
      }

      // Skip records created in the last 5 minutes to avoid triggering on new records
      const recordAge = currentTime - createdDate.getTime();
      const isNewRecord = recordAge < 5 * 60 * 1000; // 5 minutes

      if (!isNewRecord && storedRecord && storedRecord.hash !== currentHash) {
        // Record has been updated
        updatedRecords.push(record);
      }

      // Update stored hash
      storedHashes[recordKey] = {
        hash: currentHash,
        lastSeen: currentTime
      };
    }

    // Clean up old stored hashes (older than 30 days)
    const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
    Object.keys(storedHashes).forEach((key) => {
      if (storedHashes[key].lastSeen < thirtyDaysAgo) {
        delete storedHashes[key];
      }
    });

      // Save updated hashes
      await context.store.put('record_hashes', storedHashes);
      
      return updatedRecords;
    } catch (error: any) {
      throw new Error(`Failed to fetch updated records: ${error.message}`);
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
    RECORD_NAME: 'Updated Contact',
    OWNER_USER_ID: 789,
    DATE_CREATED_UTC: '2025-10-01T09:53:54.704Z',
    VISIBLE_TO: 'Everyone',
    VISIBLE_TEAM_ID: 0,
    CUSTOMFIELDS: [
      {
        FIELD_NAME: 'CUSTOM_FIELD_1',
        FIELD_VALUE: 'Updated Value'
      }
    ]
  },
});
