import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { smartsuiteAuth, workspaceId, tableId } from '../auth';
import { SmartSuiteClient } from '../lib/common/client';

/**
 * New Record Trigger
 * Polling trigger that checks for new records
 */
interface TriggerData {
  lastChecked: number;
  knownRecordIds: string[];
}

export const newRecordTrigger = createTrigger({
  auth: smartsuiteAuth,
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a table',
  type: TriggerStrategy.POLLING,
  props: {
    workspace_id: workspaceId,
    table_id: tableId,
    check_interval: Property.Number({
      displayName: 'Check Interval (minutes)',
      description: 'How often to check for new records',
      required: false,
      defaultValue: 5,
    }),
  },
  sampleData: {
    id: 'abc123',
    fields: {
      'Name': 'Example Record',
      'Status': 'Active',
    },
    created_at: '2026-03-29T06:00:00Z',
  },

  async test(context) {
    return await this.getNewRecords(context);
  },

  async onEnable(context) {
    // Initialize tracking
    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    const result = await client.listRecords(context.propsValue.table_id, 1000, 0);

    const recordIds = result.data?.map((r: any) => r.id) || [];

    await context.store?.put<TriggerData>(`${context.propsValue.table_id}`, {
      lastChecked: Date.now(),
      knownRecordIds: recordIds,
    });
  },

  async onDisable(context) {
    await context.store?.put(`${context.propsValue.table_id}`, {
      lastChecked: 0,
      knownRecordIds: [],
    });
  },

  async run(context) {
    return await this.getNewRecords(context);
  },

  async getNewRecords(context: any) {
    let tracking = await context.store?.get<TriggerData>(`${context.propsValue.table_id}`);
    if (!tracking) {
      tracking = { lastChecked: 0, knownRecordIds: [] };
    }

    const client = new SmartSuiteClient(context.auth, context.propsValue.workspace_id);
    const result = await client.listRecords(context.propsValue.table_id, 1000, 0);

    const allRecords = result.data || [];
    const newRecords = allRecords.filter((r: any) => !tracking.knownRecordIds.includes(r.id));

    // Update tracking
    const allRecordIds = allRecords.map((r: any) => r.id);
    await context.store?.put<TriggerData>(`${context.propsValue.table_id}`, {
      lastChecked: Date.now(),
      knownRecordIds: allRecordIds,
    });

    return newRecords;
  },
});
