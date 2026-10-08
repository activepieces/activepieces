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
import { teableOutputSchemas } from '../output-schemas';

const PAGE_SIZE = 500;
const TEST_SAMPLE_SIZE = 5;
const MAX_BACKFILL = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

function modifiedEpoch(record: TeableRecord): number {
  const timestamp = record.lastModifiedTime ?? record.createdTime;
  return timestamp !== undefined ? new Date(timestamp).getTime() : 0;
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

async function fetchCandidateIds({
  auth,
  tableId,
  orderBy,
  cutoffEpochMS,
}: {
  auth: TeableAuthValue;
  tableId: string;
  orderBy: string;
  cutoffEpochMS: number;
}): Promise<string[]> {
  const candidateIds: string[] = [];
  let skip = 0;
  while (skip < MAX_BACKFILL) {
    const page = await teableClient.listRecords({
      auth,
      tableId,
      query: { take: PAGE_SIZE, skip, orderBy },
    });
    const recent = page.records.filter((record) => modifiedEpoch(record) >= cutoffEpochMS);
    candidateIds.push(...recent.map((record) => record.id));
    if (page.records.length < PAGE_SIZE || recent.length < page.records.length) {
      break;
    }
    skip += PAGE_SIZE;
  }
  return candidateIds;
}

async function fetchRecentlyModified({
  auth,
  tableId,
  lastFetchEpochMS,
}: {
  auth: TeableAuthValue;
  tableId: string;
  lastFetchEpochMS: number;
}): Promise<TeableRecord[]> {
  const lastModifiedField = await requireLastModifiedField({ auth, tableId });
  const orderBy = JSON.stringify([{ fieldId: lastModifiedField.id, order: 'desc' }]);
  if (lastFetchEpochMS === 0) {
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
  const cutoffEpochMS = lastFetchEpochMS - 2 * DAY_MS;
  const candidateIds = await fetchCandidateIds({ auth, tableId, orderBy, cutoffEpochMS });
  const precise = await fetchPreciseRecords({ auth, tableId, recordIds: candidateIds });
  return precise.filter((record) => modifiedEpoch(record) > lastFetchEpochMS);
}

const polling: Polling<TeableTriggerAuth, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const records = await fetchRecentlyModified({
      auth,
      tableId: propsValue.table_id,
      lastFetchEpochMS,
    });
    return records
      .map((record) => ({ epochMilliSeconds: modifiedEpoch(record), data: record }))
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
