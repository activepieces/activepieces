import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeInsightlyRequest, insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';

export const deletedRecord = createTrigger({
  auth: insightlyAuth,
  name: 'deleted_record',
  displayName: 'Deleted Record',
  description: 'Fires when a record is deleted from Insightly',
  type: TriggerStrategy.POLLING,
  props: {
    pod: Property.ShortText({
      displayName: 'Pod',
      description: 'Your Insightly pod (e.g., "na1", "eu1"). Find this in your API URL: https://api.{pod}.insightly.com',
      required: true,
    }),
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor for deletions',
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
    const storeKey = `known_records_${context.propsValue.objectType}`;
    await context.store.put(storeKey, {});
  },
  async onDisable(context) {
    const storeKey = `known_records_${context.propsValue.objectType}`;
    await context.store.delete(storeKey);
  },
  async run(context) {
    const { pod, objectType } = context.propsValue;
    
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?brief=true&count_total=false&top=500`,
      pod
    );
    
    const records = response.body || [];
    const currentRecordIds = new Set(records.map((r: any) => r.RECORD_ID));
    const currentTime = Date.now();

    // Get stored record IDs from previous runs
    const storeKey = `known_records_${objectType}`;
    const storedRecordData = await context.store.get<Record<number, { name: string; lastSeen: number }>>(storeKey) || {};
    const storedRecordIds = new Set(Object.keys(storedRecordData).map((id) => parseInt(id)));

    const deletedRecords: any[] = [];

    // Find records that were in the previous list but are not in the current list
    for (const storedId of storedRecordIds) {
      if (!currentRecordIds.has(storedId)) {
        const recordData = storedRecordData[storedId];
        // Only consider it deleted if we haven't seen it for at least 2 polling cycles (10 minutes)
        const timeSinceLastSeen = currentTime - recordData.lastSeen;
        if (timeSinceLastSeen > 10 * 60 * 1000) { // 10 minutes
          deletedRecords.push({
            recordId: storedId,
            recordName: recordData.name || `Record ${storedId}`,
            deletedAt: new Date().toISOString(),
            objectType
          });

          // Remove from stored data
          delete storedRecordData[storedId];
        }
      }
    }

    // Update stored record data with current records
    for (const record of records) {
      storedRecordData[record.RECORD_ID] = {
        name: record.RECORD_NAME,
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
  },
  async test(context) {
    // For test, return a sample deleted record
    return [{
      recordId: 123456,
      recordName: 'Test Deleted Record',
      deletedAt: new Date().toISOString(),
      objectType: context.propsValue.objectType
    }];
  },
  sampleData: {
    recordId: 123456,
    recordName: 'Deleted Contact',
    deletedAt: '2025-10-02T09:53:54.704Z',
    objectType: 'Contacts'
  },
});
