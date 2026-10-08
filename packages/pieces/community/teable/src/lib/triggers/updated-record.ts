import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { TeableAuth, TeableAuthValue } from '../auth';
import { TeableCommon } from '../common';
import { teableClient, TeableField, TeableRecord } from '../common/client';
import { TeableFieldType } from '../common/constants';
import { teablePolling } from '../common/polling';
import { teableOutputSchemas } from '../output-schemas';

const PAGE_SIZE = 500;
const TEST_SAMPLE_SIZE = 5;

function modifiedEpoch(record: TeableRecord): number {
  const timestamp = record.lastModifiedTime ?? record.createdTime;
  return timestamp !== undefined ? new Date(timestamp).getTime() : 0;
}

function fieldModifiedEpoch({
  record,
  fieldName,
}: {
  record: TeableRecord;
  fieldName: string;
}): number {
  const value = record.fields?.[fieldName];
  if (typeof value === 'string' || typeof value === 'number') {
    const epoch = new Date(value).getTime();
    if (!Number.isNaN(epoch)) {
      return epoch;
    }
  }
  return modifiedEpoch(record);
}

async function requireLastModifiedField({
  auth,
  tableId,
}: {
  auth: TeableAuthValue;
  tableId: string;
}): Promise<TeableField> {
  const fields = await teableClient.listFields({ auth, tableId });
  const lastModifiedField = fields.find(
    (field) => field.type === TeableFieldType.LAST_MODIFIED_TIME
  );
  if (lastModifiedField === undefined) {
    throw new Error(
      'This table has no "Last modified time" field, so updates cannot be detected. In Teable, add a field of type "Last modified time" to the table, then enable this trigger again.'
    );
  }
  return lastModifiedField;
}

async function fetchPreciseRecords({
  auth,
  tableId,
  recordIds,
}: {
  auth: TeableAuthValue;
  tableId: string;
  recordIds: string[];
}): Promise<TeableRecord[]> {
  const records: TeableRecord[] = [];
  for (let start = 0; start < recordIds.length; start += PAGE_SIZE) {
    const page = await teableClient.listRecords({
      auth,
      tableId,
      query: {
        take: PAGE_SIZE,
        selectedRecordIds: recordIds.slice(start, start + PAGE_SIZE),
      },
    });
    records.push(...page.records);
  }
  return records;
}

async function fetchSampleRecords({
  auth,
  tableId,
  fieldId,
}: {
  auth: TeableAuthValue;
  tableId: string;
  fieldId: string;
}): Promise<TeableRecord[]> {
  const orderBy = JSON.stringify([{ fieldId, order: 'desc' }]);
  const sample = await teableClient.listRecords({
    auth,
    tableId,
    query: { take: TEST_SAMPLE_SIZE, orderBy },
  });
  return fetchPreciseRecords({
    auth,
    tableId,
    recordIds: sample.records.map((record) => record.id),
  });
}

async function fetchModifiedSince({
  auth,
  tableId,
  fieldId,
  epochOf,
  lastFetchEpochMS,
}: {
  auth: TeableAuthValue;
  tableId: string;
  fieldId: string;
  epochOf: (record: TeableRecord) => number;
  lastFetchEpochMS: number;
}): Promise<TeableRecord[]> {
  const orderBy = JSON.stringify([{ fieldId, order: 'asc' }]);
  const rowCount = await teableClient.getRowCount({ auth, tableId });
  const startIndex = await teablePolling.findFirstFreshIndex({
    rowCount,
    probe: async (skip) => {
      const page = await teableClient.listRecords({
        auth,
        tableId,
        query: { take: 1, skip, orderBy },
      });
      return page.records[0];
    },
    isFresh: (record) => epochOf(record) > lastFetchEpochMS,
  });
  return teablePolling.collectFreshRecords({
    listPage: async ({ skip, take }) => {
      const page = await teableClient.listRecords({
        auth,
        tableId,
        query: { take, skip, orderBy },
      });
      return page.records;
    },
    startIndex,
    epochOf,
    lastFetchEpochMS,
  });
}

const polling: Polling<TeableTriggerAuth, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const tableId = propsValue.table_id;
    const lastModifiedField = await requireLastModifiedField({ auth, tableId });
    const epochOf = (record: TeableRecord) =>
      fieldModifiedEpoch({ record, fieldName: lastModifiedField.name });
    const records =
      lastFetchEpochMS === 0
        ? await fetchSampleRecords({ auth, tableId, fieldId: lastModifiedField.id })
        : await fetchModifiedSince({
            auth,
            tableId,
            fieldId: lastModifiedField.id,
            epochOf,
            lastFetchEpochMS,
          });
    return records
      .map((record) => ({ epochMilliSeconds: epochOf(record), data: record }))
      .sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
  },
};

export const updatedRecordTrigger = createTrigger({
  auth: TeableAuth,
  name: 'teable_updated_record',
  classification: 'READ',
  displayName: 'Updated Record',
  description:
    'Triggers when a record is created or modified. The table must have a "Last modified time" field.',
  aiMetadata: {
    description:
      'Fires when a record in the selected Teable table is created or modified. The table must contain a field of type "Last modified time"; enabling the trigger fails with instructions when it is missing. A record modified again later fires again.',
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
  },
  sampleData: {
    id: 'recql6P1Rc5fWQAlCbp',
    fields: {
      Name: 'AP test rec 2',
      Count: 2,
      Notes: 'updated by builder test',
      Rating: 5,
    },
    name: 'AP test rec 2',
    autoNumber: 2,
    createdTime: '2026-10-08T17:14:37.172Z',
    lastModifiedTime: '2026-10-08T17:15:12.724Z',
    createdBy: 'usr639NrlzGxCX1oWEb',
    lastModifiedBy: 'usr639NrlzGxCX1oWEb',
  },
  outputSchema: teableOutputSchemas.record,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await requireLastModifiedField({ auth: context.auth, tableId: context.propsValue.table_id });
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
