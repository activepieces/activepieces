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

export const deletedRecord = createTrigger({
  auth: insightlyAuth,
  name: 'deleted_record',
  displayName: 'Deleted Record',
  description: 'Fires when a record is deleted from Insightly',
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
      description: 'The type of Insightly object to monitor for deletions',
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
      description: 'Maximum number of records to monitor for deletions (1-500)',
      required: false,
      defaultValue: 500
    })
  },
  async onEnable(context) {
    const storeKey = `known_records_${context.propsValue.objectType}`;
    await context.store.put(storeKey, {});
  },
  async onDisable(context) {
    const storeKey = `known_records_${context.propsValue.objectType}`;
    await context.store.delete(storeKey);
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
    const { maxRecords = 500 } = context.propsValue;
    const limitedRecords = Math.min(Math.max(maxRecords, 1), 500); // Ensure between 1-500

    // Use brief=true for better performance when monitoring deletions
    const url = `${baseUrl}/${endpoint}?brief=true&count_total=false&top=${limitedRecords}`;

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

      // Helper function to get record name
      function getRecordName(record: any, objectType: string): string {
        if (objectType === 'Contacts') {
          return (
            `${record.FIRST_NAME || ''} ${record.LAST_NAME || ''}`.trim() ||
            `Contact ${getRecordId(record, objectType)}`
          );
        } else if (objectType === 'Organisations') {
          return (
            record.ORGANISATION_NAME ||
            `Organization ${getRecordId(record, objectType)}`
          );
        } else if (objectType === 'Opportunities') {
          return (
            record.OPPORTUNITY_NAME ||
            `Opportunity ${getRecordId(record, objectType)}`
          );
        } else if (objectType === 'Projects') {
          return (
            record.PROJECT_NAME || `Project ${getRecordId(record, objectType)}`
          );
        } else if (objectType === 'Products') {
          return (
            record.PRODUCT_NAME || `Product ${getRecordId(record, objectType)}`
          );
        } else if (objectType === 'Quotation') {
          return (
            record.QUOTATION_NAME || `Quote ${getRecordId(record, objectType)}`
          );
        } else if (
          objectType === 'Tasks' ||
          objectType === 'Events' ||
          objectType === 'Notes'
        ) {
          return (
            record.TITLE ||
            `${objectType.slice(0, -1)} ${getRecordId(record, objectType)}`
          );
        } else {
          return (
            record.RECORD_NAME || `Record ${getRecordId(record, objectType)}`
          );
        }
      }

      const currentRecordIds = new Set(
        records.map((r: any) => getRecordId(r, objectType))
      );
      const currentTime = Date.now();

      // Get stored record IDs from previous runs
      const storeKey = `known_records_${objectType}`;
      const storedRecordData =
        (await context.store.get<
          Record<number, { name: string; lastSeen: number }>
        >(storeKey)) || {};
      const storedRecordIds = new Set(
        Object.keys(storedRecordData).map((id) => parseInt(id))
      );

      const deletedRecords: any[] = [];

      // Find records that were in the previous list but are not in the current list
      for (const storedId of storedRecordIds) {
        if (!currentRecordIds.has(storedId)) {
          const recordData = storedRecordData[storedId];
          // Only consider it deleted if we haven't seen it for at least 2 polling cycles (15 minutes)
          // This reduces false positives from API delays or temporary issues
          const timeSinceLastSeen = currentTime - recordData.lastSeen;
          if (timeSinceLastSeen > 15 * 60 * 1000) {
            // 15 minutes
            deletedRecords.push({
              recordId: storedId,
              recordName: recordData.name || `Record ${storedId}`,
              deletedAt: new Date().toISOString(),
              objectType,
              lastSeenAt: new Date(recordData.lastSeen).toISOString()
            });

            // Remove from stored data
            delete storedRecordData[storedId];
          }
        }
      }

      // Update stored record data with current records
      for (const record of records) {
        const recordId = getRecordId(record, objectType);
        storedRecordData[recordId] = {
          name: getRecordName(record, objectType),
          lastSeen: currentTime
        };
      }

      // Clean up very old records (older than 30 days)
      const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
      Object.keys(storedRecordData).forEach((id) => {
        const recordData = storedRecordData[parseInt(id)];
        if (recordData.lastSeen < thirtyDaysAgo) {
          delete storedRecordData[parseInt(id)];
        }
      });

      // Save updated record data
      await context.store.put(storeKey, storedRecordData);

      return deletedRecords;
    } catch (error: any) {
      throw new Error(
        `Failed to fetch records for deletion monitoring: ${error.message}`
      );
    }
  },
  test: async (context) => {
    // For testing, we simulate a deleted record since actual deletion detection requires monitoring over time
    const { objectType } = context.propsValue;
    
    // Return sample deleted record data for testing purposes
    return [
      {
        recordId: 123456,
        recordName: 'Test Deleted Record',
        deletedAt: new Date().toISOString(),
        objectType,
        lastSeenAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
      }
    ];
  },
  sampleData: {
    recordId: 123456,
    recordName: 'Test Deleted Record',
    deletedAt: '2025-10-04T02:00:31.211Z',
    objectType: 'Contacts',
    lastSeenAt: '2025-10-04T01:45:31.211Z'
  }
});
