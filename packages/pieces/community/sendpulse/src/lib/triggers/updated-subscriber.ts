import { createHash } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, isNil, OutputSchema, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';
import { isRecord, parseMailingListId, sendpulseApiCall, SendPulseAuthProps } from '../common/client';
import { mailingListDropdown } from '../common/props';

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

function hashOf(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, HASH_LENGTH);
}

async function fetchAllContacts({ auth, listId }: { auth: SendPulseAuthProps; listId: string }): Promise<Record<string, unknown>[]> {
  const contacts: Record<string, unknown>[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await sendpulseApiCall<unknown>({
      method: HttpMethod.GET,
      auth,
      resourceUri: `/addressbooks/${listId}/emails`,
      query: { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      operation: 'list mailing list contacts',
    });
    if (!Array.isArray(response)) {
      throw new Error(`SendPulse list mailing list contacts returned an unexpected response: ${JSON.stringify(response).slice(0, 300)}`);
    }
    const items = response.filter(isRecord);
    contacts.push(...items);
    if (response.length < PAGE_SIZE) {
      return contacts;
    }
  }
  throw new Error(`Mailing list ${listId} has more than ${MAX_PAGES * PAGE_SIZE} contacts, which is more than the Updated Subscriber trigger can track (its snapshot must stay under the ${STORE_LIMIT_KB} KB trigger storage limit).`);
}

function buildSnapshot({ listId, contacts }: { listId: string; contacts: Record<string, unknown>[] }): Snapshot {
  const serialized = contacts.flatMap((contact) => {
    const email = contact['email'];
    if (typeof email !== 'string') {
      return [];
    }
    const pair: [string, string] = [email.toLowerCase(), canonicalJson(contact)];
    return [pair];
  });
  const full: Snapshot = { listId, mode: 'full', entries: Object.fromEntries(serialized) };
  if (snapshotBytes(full) <= MAX_SNAPSHOT_BYTES) {
    return full;
  }
  const hashed: Snapshot = { listId, mode: 'hash', entries: Object.fromEntries(serialized.map(([email, json]) => [email, hashOf(json)])) };
  if (snapshotBytes(hashed) > MAX_SNAPSHOT_BYTES) {
    throw new Error(`Mailing list ${listId} has too many contacts (${serialized.length}) for the Updated Subscriber trigger: its change snapshot would exceed the ${STORE_LIMIT_KB} KB trigger storage limit. Use a smaller mailing list.`);
  }
  return hashed;
}

function snapshotBytes(snapshot: Snapshot): number {
  return Buffer.byteLength(JSON.stringify(snapshot), 'utf8');
}

function isSnapshot(value: unknown): value is Snapshot {
  return isRecord(value) && typeof value['listId'] === 'string' && (value['mode'] === 'full' || value['mode'] === 'hash') && isRecord(value['entries']);
}

function detectChanges({ previous, current }: { previous: Record<string, unknown>; current: Record<string, unknown> }): Record<string, { from: unknown; to: unknown }> {
  const keys = [...new Set([...Object.keys(previous), ...Object.keys(current)])];
  return Object.fromEntries(
    keys
      .filter((key) => canonicalJson(previous[key]) !== canonicalJson(current[key]))
      .map((key) => [key, { from: previous[key] ?? null, to: current[key] ?? null }]),
  );
}

function parseStored(json: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(json);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function diffSnapshots({ previous, contacts, listId }: { previous: Snapshot; contacts: Record<string, unknown>[]; listId: string }) {
  const updatedAt = new Date().toISOString();
  return contacts.flatMap((current) => {
    const email = current['email'];
    if (typeof email !== 'string') {
      return [];
    }
    const stored = previous.entries[email.toLowerCase()];
    if (typeof stored !== 'string') {
      return [];
    }
    const json = canonicalJson(current);
    const currentHash = hashOf(json);
    const unchanged = previous.mode === 'full' ? stored === json : stored === currentHash;
    if (unchanged) {
      return [];
    }
    const previousData = previous.mode === 'full' ? parseStored(stored) : null;
    return [{
      id: `${email}_${previous.mode === 'full' ? hashOf(stored) : stored}_${currentHash}`,
      email,
      mailingListId: listId,
      previousData,
      currentData: current,
      updatedAt,
      changes: previousData ? detectChanges({ previous: previousData, current }) : {},
    }];
  });
}

const PAGE_SIZE = 100;
const MAX_PAGES = 50;
const HASH_LENGTH = 16;
const STORE_LIMIT_KB = 512;
const MAX_SNAPSHOT_BYTES = 400 * 1024;
const SNAPSHOT_KEY = 'subscribers_snapshot';

const sampleData = {
  id: 'updated-user@example.com_9b1e4c7a2d5f8e03_3f2a9c1d7e5b4a60',
  email: 'updated-user@example.com',
  mailingListId: '123456',
  previousData: {
    email: 'updated-user@example.com',
    status: 0,
    status_explain: 'New',
    variables: { phone: '+1234567890', name: 'John' },
  },
  currentData: {
    email: 'updated-user@example.com',
    status: 0,
    status_explain: 'New',
    variables: { phone: '+0987654321', name: 'John Updated' },
  },
  updatedAt: '2023-06-01T12:30:00.000Z',
  changes: {
    variables: {
      from: { phone: '+1234567890', name: 'John' },
      to: { phone: '+0987654321', name: 'John Updated' },
    },
  },
};

const outputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Event ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'mailingListId', label: 'Mailing List ID' },
    { key: 'previousData', label: 'Previous Data' },
    { key: 'currentData', label: 'Current Data' },
    { key: 'changes', label: 'Changed Fields', dynamicKey: true },
    { key: 'updatedAt', label: 'Detected At', format: 'datetime' },
  ],
};

export const updatedSubscriberTrigger = createTrigger({
  auth: sendpulseAuth,
  name: 'updated_subscriber',
  classification: 'READ',
  displayName: 'Updated Subscriber',
  description: 'Fires when subscriber details change (polling)',
  aiMetadata: {
    description: 'Polls the selected SendPulse mailing list (address book) and fires when an existing subscriber\'s details or variables change between checks. Each event represents one changed contact and includes the previous data, current data, and a diff of the changed fields (previous data is null for very large lists).',
  },
  type: TriggerStrategy.POLLING,
  props: {
    mailingListId: mailingListDropdown,
  },
  outputSchema,
  async onEnable(context) {
    const listId = parseMailingListId(context.propsValue.mailingListId);
    const existing = await context.store.get<unknown>(SNAPSHOT_KEY);
    if (context.isRepublish && isSnapshot(existing) && existing.listId === listId) {
      return;
    }
    const contacts = await fetchAllContacts({ auth: context.auth.props, listId });
    await context.store.put(SNAPSHOT_KEY, buildSnapshot({ listId, contacts }));
    await context.store.delete('subscribers_cache');
    await context.store.delete('mailing_list_id');
  },

  async onDisable(context) {
    if (context.isRepublish) {
      return;
    }
    await context.store.delete(SNAPSHOT_KEY);
    await context.store.delete('subscribers_cache');
    await context.store.delete('mailing_list_id');
    await context.store.delete('last_check');
  },

  async run(context) {
    const listId = parseMailingListId(context.propsValue.mailingListId);
    const previous = await context.store.get<unknown>(SNAPSHOT_KEY);
    const contacts = await fetchAllContacts({ auth: context.auth.props, listId });
    const snapshot = buildSnapshot({ listId, contacts });
    if (isNil(previous) || !isSnapshot(previous) || previous.listId !== listId) {
      await context.store.put(SNAPSHOT_KEY, snapshot);
      return [];
    }
    const changes = diffSnapshots({ previous, contacts, listId });
    await context.store.put(SNAPSHOT_KEY, snapshot);
    return changes;
  },

  async test(context) {
    const listId = parseMailingListId(context.propsValue.mailingListId);
    const contacts = await fetchAllContacts({ auth: context.auth.props, listId });
    const recent = contacts.slice(0, 5).map((contact) => ({
      id: `${String(contact['email'])}_test`,
      email: contact['email'],
      mailingListId: listId,
      previousData: contact,
      currentData: contact,
      updatedAt: new Date().toISOString(),
      changes: {},
    }));
    return recent.length > 0 ? recent : [sampleData];
  },

  sampleData,
});

type SnapshotMode = 'full' | 'hash';

type Snapshot = {
  listId: string;
  mode: SnapshotMode;
  entries: Record<string, unknown>;
};
