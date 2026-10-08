import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { TeableAuth, TeableAuthValue } from '../auth';
import { TeableCommon } from '../common';
import { teableClient, TeableRecord } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

const PAGE_SIZE = 500;
const TEST_SAMPLE_SIZE = 5;
const MAX_BACKFILL = 5000;

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

async function fetchRecordsNewerThan({
  auth,
  tableId,
  lastFetchEpochMS,
}: {
  auth: TeableAuthValue;
  tableId: string;
  lastFetchEpochMS: number;
}): Promise<TeableRecord[]> {
  const rowCount = await teableClient.getRowCount({ auth, tableId });
  const collected = new Map<string, TeableRecord>();
  let end = rowCount;
  let fetched = 0;
  while (end > 0 && fetched < MAX_BACKFILL) {
    const start = Math.max(0, end - PAGE_SIZE);
    const page = await teableClient.listRecords({
      auth,
      tableId,
      query: { take: end - start, skip: start },
    });
    fetched += page.records.length;
    let sawOlder = page.records.length === 0;
    for (const record of page.records) {
      if (createdEpoch(record) > lastFetchEpochMS) {
        collected.set(record.id, record);
      } else {
        sawOlder = true;
      }
    }
    if (sawOlder || start === 0) {
      break;
    }
    end = start;
  }
  return [...collected.values()];
}

const polling: Polling<TeableTriggerAuth, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const tableId = propsValue.table_id;
    const records =
      lastFetchEpochMS === 0
        ? await fetchTailRecords({ auth, tableId, count: TEST_SAMPLE_SIZE })
        : await fetchRecordsNewerThan({ auth, tableId, lastFetchEpochMS });
    return records
      .map((record) => ({ epochMilliSeconds: createdEpoch(record), data: record }))
      .sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
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
      'Fires when a new record is created in the selected Teable table. Polls on a schedule and emits each new record once, with its field values, ID, and creation time.',
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
