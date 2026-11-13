import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  pollingHelper,
  Polling,
} from '@activepieces/pieces-common';
import { base44Auth, base44Common, EntityRecordData } from '../common/client';

function toEpoch(value: unknown): number {
  const normalized = base44Common.normalizeTimestamp(value);
  if (typeof normalized !== 'string' && typeof normalized !== 'number') {
    return Number.NaN;
  }
  return new Date(normalized).getTime();
}

function toEpochMicros(value: unknown): number {
  const epochMs = toEpoch(value);
  if (Number.isNaN(epochMs) || typeof value !== 'string') {
    return epochMs * 1000;
  }
  const fraction = /T\d{2}:\d{2}:\d{2}\.(\d+)/.exec(value)?.[1] ?? '';
  const subMillisecond = Number(fraction.padEnd(6, '0').slice(3, 6));
  return epochMs * 1000 + subMillisecond;
}

function selectEventRecords({
  records,
  eventType,
  lastFetchEpochMS,
}: {
  records: EntityRecordData[];
  eventType: string;
  lastFetchEpochMS: number;
}): { epochMilliSeconds: number; record: EntityRecordData }[] {
  const timeKey = eventType === 'created' ? 'created_date' : 'updated_date';
  return records
    .filter((record) => {
      if (eventType === 'created') {
        return true;
      }
      return toEpochMicros(record['updated_date']) !== toEpochMicros(record['created_date']);
    })
    .map((record) => ({ epochMilliSeconds: toEpoch(record[timeKey]), record }))
    .filter(({ epochMilliSeconds }) => !Number.isNaN(epochMilliSeconds) && epochMilliSeconds > lastFetchEpochMS);
}

const polling: Polling<Base44AuthType, { entityType: string; eventType: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { entityType, eventType } = propsValue;
    const handler = await base44Common.getEntityHandler({ auth: auth.props, entityType });
    const sortField = eventType === 'created' ? '-created_date' : '-updated_date';
    try {
      const records = base44Common.toRecordList(await handler.list(sortField, POLL_LIMIT));
      return selectEventRecords({ records, eventType, lastFetchEpochMS }).map(({ epochMilliSeconds, record }) => ({
        epochMilliSeconds,
        data: { ...record, _eventType: eventType, _entityType: entityType },
      }));
    } catch (error: unknown) {
      throw base44Common.toBase44Error({ error, entityType, operation: 'poll records' });
    }
  },
};

export const entityEvent = createTrigger({
  auth: base44Auth,
  name: 'entity_event',
  classification: 'READ',
  displayName: 'Entity Event',
  description: 'Triggers when an entity is created or updated',
  aiMetadata: {
    description: 'Fires when a record of a chosen entity type is created or updated in a Base44 app, polling on the selected event type (created vs. updated). "Updated" only fires for records whose updated date differs from their created date. Each emitted item is one record with its built-in fields (id, created_date, updated_date, created_by_id, is_sample), every app-defined field of that entity (e.g. name, status) as a top-level key, plus _eventType and _entityType.',
  },
  props: {
    entityType: Property.ShortText({
      displayName: 'Entity Type',
      description: 'The name of the entity type (e.g. "Product", "User", "Order")',
      required: true,
    }),
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'When to trigger. "Updated" ignores newly created records that were never edited.',
      required: true,
      defaultValue: 'created',
      options: {
        disabled: false,
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Updated', value: 'updated' },
        ],
      },
    }),
  },
  outputSchema: {
    fields: [
      ...base44Common.recordFields,
      { key: '_eventType', label: 'Event Type' },
      { key: '_entityType', label: 'Entity Type' },
    ],
  },
  sampleData: {
    id: '6720f1c2a9b3e4d5f6a7b8c9',
    created_date: '2024-01-01T00:00:00.000Z',
    updated_date: '2024-01-01T00:00:00.000Z',
    created_by: 'user@example.com',
    created_by_id: '6720f1c2a9b3e4d5f6a7b800',
    is_sample: false,
    name: 'Sample Product',
    _eventType: 'created',
    _entityType: 'Product',
  },
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, ctx);
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, ctx);
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, ctx);
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
});

const POLL_LIMIT = 500;

type Base44AuthType = AppConnectionValueForAuthProperty<typeof base44Auth>;

export const entityEventInternals = { selectEventRecords, toEpochMicros };
