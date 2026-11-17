import { createTrigger, isNil, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { insightlyClient, InsightlyError, insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, OBJECT_OPTIONS, podProperty } from '../common/common';
import { outputSchemas } from '../common/output-schemas';

function normalizeStored(value: unknown): KnownRecords {
  if (!insightlyUtils.isRecord(value)) {
    return {};
  }
  const result: KnownRecords = {};
  for (const [id, entry] of Object.entries(value)) {
    const parsed = parseEntry({ id, entry });
    if (parsed) {
      result[id] = parsed;
    }
  }
  return result;
}

function parseEntry({ id, entry }: { id: string; entry: unknown }): KnownEntry | null {
  if (Array.isArray(entry)) {
    const minutes = insightlyUtils.readNumber(entry[0]);
    return minutes === null ? null : [minutes, compactName({ name: insightlyUtils.readString(entry[1]), id })];
  }
  if (insightlyUtils.isRecord(entry)) {
    const lastSeenMs = insightlyUtils.readNumber(entry['lastSeenMs']);
    return lastSeenMs === null ? null : [Math.floor(lastSeenMs / MINUTE_MS), compactName({ name: insightlyUtils.readString(entry['name']), id })];
  }
  const minutes = insightlyUtils.readNumber(entry);
  return minutes === null ? null : [minutes, `Record ${id}`];
}

function compactName({ name, id }: { name: string | null; id: string }): string {
  const clean = (name ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return clean === '' ? `Record ${id}` : Array.from(clean).slice(0, MAX_NAME_LENGTH).join('');
}

function tooMany({ objectType, detail }: { objectType: string; detail: string }): InsightlyError {
  return new InsightlyError({
    message: `Too many records to watch: ${objectType} ${detail}. The Deleted Record trigger supports up to ${MAX_WATCHED_RECORDS} records per object type.`,
    status: 413,
  });
}

function detectDeletions({ stored, records, nowMs, objectType }: DetectParams): DetectResult {
  const current = new Map<string, string>();
  for (const record of records) {
    const id = insightlyCommon.recordIdOf({ record, objectName: objectType });
    if (id) {
      current.set(id, compactName({ name: insightlyCommon.recordNameOf(record), id }));
    }
  }
  if (current.size > MAX_WATCHED_RECORDS) {
    throw tooMany({ objectType, detail: `has ${current.size} records` });
  }
  const nowMinutes = Math.floor(nowMs / MINUTE_MS);
  const nextStored: KnownRecords = {};
  const deleted: DeletedRecord[] = [];
  for (const [id, [lastSeenMinutes, name]] of Object.entries(stored)) {
    if (current.has(id)) {
      continue;
    }
    const lastSeenMs = lastSeenMinutes * MINUTE_MS;
    if (nowMs - lastSeenMs > DELETION_THRESHOLD_MS) {
      deleted.push({
        recordId: Number(id),
        recordName: name,
        deletedAt: new Date(nowMs).toISOString(),
        objectType,
        lastSeenAt: new Date(lastSeenMs).toISOString(),
      });
    } else {
      nextStored[id] = [lastSeenMinutes, name];
    }
  }
  for (const [id, name] of current) {
    nextStored[id] = [nowMinutes, name];
  }
  const bytes = Buffer.byteLength(JSON.stringify(nextStored), 'utf8');
  if (bytes > MAX_STORE_BYTES) {
    throw tooMany({ objectType, detail: `needs ${bytes} bytes of trigger state (limit ${MAX_STORE_BYTES})` });
  }
  return { deleted, nextStored };
}

function storeKey(objectType: string): string {
  return `known_records_${objectType}`;
}

type KnownEntry = [number, string];

type KnownRecords = Record<string, KnownEntry>;

type DeletedRecord = { recordId: number; recordName: string; deletedAt: string; objectType: string; lastSeenAt: string };

type DetectParams = { stored: KnownRecords; records: Record<string, unknown>[]; nowMs: number; objectType: string };

type DetectResult = { deleted: DeletedRecord[]; nextStored: KnownRecords };

const MINUTE_MS = 60 * 1000;
const MAX_WATCHED_RECORDS = 5000;
const MAX_NAME_LENGTH = 60;
const MAX_STORE_BYTES = 450 * 1024;
const DELETION_THRESHOLD_MS = 15 * 60 * 1000;
const SAMPLE_DELETED = {
  recordId: 123456,
  recordName: 'Test Deleted Record',
  deletedAt: '2026-01-15T10:45:00.000Z',
  objectType: 'Contacts',
  lastSeenAt: '2026-01-15T10:30:00.000Z',
};

export const deletedRecord = createTrigger({
  auth: insightlyAuth,
  name: 'deleted_record',
  classification: 'READ',
  displayName: 'Deleted Record',
  description: 'Fires when a record is deleted from Insightly',
  aiMetadata: {
    description:
      'Fires when a record disappears from the selected Insightly object type (Contact, Lead, Opportunity, Organization, Project, Task, Event, Product, or Quote), inferring deletion by polling every record and comparing against previously seen records. A deletion is only reported after the record has been absent for at least 15 minutes, so events are delayed and approximate rather than real-time.',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: outputSchemas['deletedTrigger'],
  props: {
    pod: podProperty(),
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to monitor for deletions',
      required: true,
      options: { options: OBJECT_OPTIONS },
    }),
  },
  async onEnable(context) {
    const key = storeKey(context.propsValue.objectType);
    if (context.isRepublish && !isNil(await context.store.get(key))) {
      return;
    }
    await context.store.put(key, {});
  },
  async onDisable(context) {
    if (context.isRepublish) {
      return;
    }
    await context.store.delete(storeKey(context.propsValue.objectType));
  },
  async run(context) {
    const objectType = insightlyCommon.ensureObject(context.propsValue.objectType);
    const connection = await insightlyCommon.connect({ auth: context.auth, pod: context.propsValue.pod });
    const { records } = await insightlyClient.paginate({ apiKey: connection.apiKey, pod: connection.pod, path: `/${objectType}`, query: { brief: 'true' } });
    const key = storeKey(objectType);
    const stored = normalizeStored(await context.store.get<unknown>(key));
    const { deleted, nextStored } = detectDeletions({ stored, records, nowMs: Date.now(), objectType });
    await context.store.put(key, nextStored);
    return deleted;
  },
  async test(context) {
    return [{ ...SAMPLE_DELETED, objectType: context.propsValue.objectType }];
  },
  sampleData: SAMPLE_DELETED,
});

export const deletedRecordInternals = { detectDeletions, normalizeStored, MAX_WATCHED_RECORDS, MAX_STORE_BYTES };
