import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { smartsuiteAuth, workspaceId, tableId } from '../auth';
import { SmartSuiteClient } from '../lib/common/client';

/**
 * Updated Record Trigger
 * Polling trigger that checks for updated records
 */
interface UpdateTriggerData {
  lastChecked: number;
  recordHashes: Record<string, string>;
}

function getRecordHash(record: any): string {
  return JSON.stringify(record.fields || record);
}

export const updatedRecordTrigger = createTrigger({
  auth: smartsuiteAuth,
  name: 'updated_record',
  displayName: 'Updated Record',
  description: 'Triggers when a record is updated in a table',
  type: TriggerStrategy.POLLING,
  props: {
    workspace_id: workspaceId,
    table_id: tableId,
    check_interval: Property.Number({
      displayName: 'Check Interval (minutes)',
      description: 'How often to check for updated records',
      required: false,
      defaultValue: 5,
    }),
  },
  sampleData: {
    id: 'abc123',
    fields: {
      'Name': 'Updated Record',
      'Status': 'Completed',
    },
    updated_at: '2026-03-29T06:30:00Z',
  },

  async test(context) {
    return await this.getUpdatedRecords(context);
  },

  async onEnable(context) {
    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    const result = await client.listRecords(context.propsValue.table_id, 1000, 0);

    const hashes: Record<string, string> = {};
    for (const record of result.data || []) {
      hashes[record.id] = getRecordHash(record);
    }

    await context.store?.put<UpdateTriggerData>(`${context.propsValue.table_id}`, {
      lastChecked: Date.now(),
      recordHashes: hashes,
    });
  },

  async onDisable(context) {
    await context.store?.put(`${context.propsValue.table_id}`, {
      lastChecked: 0,
      recordHashes: {},
    });
  },

  async run(context) {
    return await this.getUpdatedRecords(context);
  },

  async getUpdatedRecords(context: any) {
    const tracking = await context.store?.get<UpdateTriggerData>(`${context.propsValue.table_id}`);
    if (!tracking) {
      tracking = { lastChecked: 0, recordHashes: {} };
    }

    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    const result = await client.listRecords(context.propsValue.table_id, 1000, 0);

    const updatedRecords: any[] = [];
    const newHashes: Record<string, string> = {};

    for (const record of result.data || []) {
      const newHash = getRecordHash(record);
      newHashes[record.id] = newHash;

      const oldHash = tracking.recordHashes[record.id];
      if (oldHash && oldHash !== newHash) {
        updatedRecords.push(record);
      }
    }

    await context.store?.put<UpdateTriggerData>(`${context.propsValue.table_id}`, {
      lastChecked: Date.now(),
      recordHashes: newHashes,
    });

    return updatedRecords;
  },
});
