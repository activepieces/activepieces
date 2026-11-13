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
const TIME_FORMATTING_NONE = 'None';

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
  const lastModifiedFields = fields.filter(
    (field) => field.type === TeableFieldType.LAST_MODIFIED_TIME
  );
  if (lastModifiedFields.length === 0) {
    throw new Error(
      'This table has no "Last modified time" field, so updates cannot be detected. In Teable, add a field of type "Last modified time" to the table, set its time format to 24 hour or 12 hour, then enable this trigger again.'
    );
  }
  const preciseField = lastModifiedFields.find(showsTimeOfDay);
  if (preciseField === undefined) {
    throw new Error(
      `The "Last modified time" field "${lastModifiedFields[0].name}" hides the time of day, so Teable sorts it by date only and changes made on the same day cannot be told apart. In Teable, edit that field and set its time format to 24 hour or 12 hour, then enable this trigger again.`
    );
  }
  return preciseField;
}

// Teable sorts a date field by its formatted date string when the time format is
// None (its default), and by the exact timestamp only when the time is shown.
function showsTimeOfDay(field: TeableField): boolean {
  const formatting = field.options?.['formatting'];
  if (typeof formatting !== 'object' || formatting === null || !('time' in formatting)) {
    return false;
  }
  return typeof formatting.time === 'string' && formatting.time !== TIME_FORMATTING_NONE;
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

const polling: Polling<TeableTriggerAuth, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, store, propsValue, lastFetchEpochMS }) => {
    const tableId = propsValue.table_id;
    const lastModifiedField = await requireLastModifiedField({ auth, tableId });
    const epochOf = (record: TeableRecord) =>
      fieldModifiedEpoch({ record, fieldName: lastModifiedField.name });
    if (lastFetchEpochMS === 0) {
      const sample = await fetchSampleRecords({ auth, tableId, fieldId: lastModifiedField.id });
      return sample
        .map((record) => ({ epochMilliSeconds: epochOf(record), data: record }))
        .sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
    }
    const orderBy = JSON.stringify([{ fieldId: lastModifiedField.id, order: 'asc' }]);
    const rowCount = await teableClient.getRowCount({ auth, tableId });
    const items = await teablePolling.pollFreshItems({
      store,
      storeKey: 'teable_updated_record_frontier',
      rowCount,
      fetchPage: async ({ skip, take }) => {
        const page = await teableClient.listRecords({
          auth,
          tableId,
          query: { take, skip, orderBy },
        });
        return page.records;
      },
      epochOf,
      lastFetchEpochMS,
    });
    return items.sort((a, b) => b.epochMilliSeconds - a.epochMilliSeconds);
  },
};

export const updatedRecordTrigger = createTrigger({
  auth: TeableAuth,
  name: 'teable_updated_record',
  classification: 'READ',
  displayName: 'Updated Record',
  description:
    'Triggers when a record is created or modified. The table must have a "Last modified time" field that shows the time.',
  aiMetadata: {
    description:
      'Fires when a record in the selected Teable table is created or modified. The table must contain a field of type "Last modified time" whose time format is 24 hour or 12 hour (with no time shown, which is the Teable default, it sorts by date only); enabling the trigger, or a later poll, fails with instructions when no such field exists. A record modified again later fires again. Large backlogs are delivered across successive polls without loss; only in the extreme case of more than 25,000 records sharing one identical "Last modified time" value can records beyond that bound be skipped. Delivery is at-least-once: after a platform error during a poll, the next poll may deliver some records again rather than lose them.',
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
