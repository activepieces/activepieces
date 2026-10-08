import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { TeableAuth, TeableAuthValue } from '../auth';
import { TeableCommon } from '../common';
import { teableClient, TeableRecord } from '../common/client';
import { teablePolling } from '../common/polling';
import { teableOutputSchemas } from '../output-schemas';

const TEST_SAMPLE_SIZE = 5;

function createdEpoch(record: TeableRecord): number {
  return record.createdTime !== undefined ? new Date(record.createdTime).getTime() : 0;
}

async function fetchTailRecords({
  auth,
  tableId,
  count,
}: {
  auth: TeableAuthValue;
  tableId: string;
  count: number;
}): Promise<TeableRecord[]> {
  const rowCount = await teableClient.getRowCount({ auth, tableId });
  const skip = Math.max(0, rowCount - count);
  const page = await teableClient.listRecords({
    auth,
    tableId,
    query: { take: count, skip },
  });
  return page.records;
}

const polling: Polling<TeableTriggerAuth, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, store, propsValue, lastFetchEpochMS }) => {
    const tableId = propsValue.table_id;
    if (lastFetchEpochMS === 0) {
      const sample = await fetchTailRecords({ auth, tableId, count: TEST_SAMPLE_SIZE });
      return sample
        .map((record) => ({ epochMilliSeconds: createdEpoch(record), data: record }))
        .sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
    }
    const rowCount = await teableClient.getRowCount({ auth, tableId });
    const items = await teablePolling.pollFreshItems({
      store,
      storeKey: 'teable_new_record_frontier',
      rowCount,
      fetchPage: async ({ skip, take }) => {
        const page = await teableClient.listRecords({
          auth,
          tableId,
          query: { take, skip },
        });
        return page.records;
      },
      epochOf: createdEpoch,
      lastFetchEpochMS,
    });
    return items.sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
  },
};

export const newRecordTrigger = createTrigger({
  auth: TeableAuth,
  name: 'teable_new_record',
  classification: 'READ',
  displayName: 'New Record',
  description: 'Triggers when a new record is created in a table.',
  aiMetadata: {
    description:
      'Fires when a new record is created in the selected Teable table. Polls on a schedule and emits each new record once, with its field values, ID, and creation time. Large backlogs are delivered across successive polls without loss; only in the extreme case of more than 25,000 records sharing one identical creation timestamp can records beyond that bound be skipped. Delivery is at-least-once: after a platform error during a poll, the next poll may deliver some records again rather than lose them.',
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
  },
  sampleData: {
    id: 'recPJvqohF1HW69vfbl',
    fields: {
      Name: 'AP test rec 1',
      Count: 1,
      Notes: 'first',
    },
    name: 'AP test rec 1',
    autoNumber: 1,
    createdTime: '2026-10-08T17:14:37.172Z',
    lastModifiedTime: '2026-10-08T17:14:37.172Z',
    createdBy: 'usr639NrlzGxCX1oWEb',
    lastModifiedBy: 'usr639NrlzGxCX1oWEb',
  },
  outputSchema: teableOutputSchemas.record,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});

type TeableTriggerAuth = AppConnectionValueForAuthProperty<(typeof TeableAuth)[number]>;

type Props = {
  base_id: string;
  table_id: string;
};
