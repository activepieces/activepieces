import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeInsightlyRequest, insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';

// Helper function to create a hash of record data (excluding creation date and ID)
function createRecordHash(record: any): string {
  const hashData = {
    RECORD_NAME: record.RECORD_NAME,
    OWNER_USER_ID: record.OWNER_USER_ID,
    VISIBLE_TO: record.VISIBLE_TO,
    VISIBLE_TEAM_ID: record.VISIBLE_TEAM_ID,
    CUSTOMFIELDS: record.CUSTOMFIELDS || []
  };
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
    }),
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor for updates',
      required: true,
      options: {
        options: INSIGHTLY_OBJECTS.map(obj => ({
          label: obj,
          value: obj,
        })),
      },
    }),
  },
  async onEnable(context) {
    await context.store.put('record_hashes', {});
  },
  async onDisable(context) {
    await context.store.delete('record_hashes');
  },
  async run(context) {
    const { pod, objectType } = context.propsValue;
    
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?brief=false&count_total=false`,
      pod
    );
    
    const records = response.body || [];
    const storedHashes = await context.store.get<Record<string, { hash: string; lastSeen: number }>>('record_hashes') || {};
    const currentTime = Date.now();
    const updatedRecords: any[] = [];

    for (const record of records) {
      const recordKey = `${objectType}_${record.RECORD_ID}`;
      const currentHash = createRecordHash(record);
      const storedRecord = storedHashes[recordKey];

      // Skip records created in the last 5 minutes to avoid triggering on new records
      const recordAge = currentTime - new Date(record.DATE_CREATED_UTC).getTime();
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
  },
  async test(context) {
    const { pod, objectType } = context.propsValue;
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?top=1`,
      pod
    );
    return response.body || [];
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
