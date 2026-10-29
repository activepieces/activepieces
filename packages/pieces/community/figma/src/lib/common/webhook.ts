import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { HttpMethod } from '@activepieces/pieces-common';
import { DEDUPE_KEY_PROPERTY, Property } from '@activepieces/pieces-framework';
import { figmaClient, FigmaApiError } from './client';

const WEBHOOK_KEY = 'figma_webhook';
const LEGACY_KEY = 'figma_new_comment_trigger_data';
const SLOT_KEY_PREFIX = 'figma_seen_events_';
const SLOT_COUNT = 32;
const MAX_PER_SLOT = 100;
const DEDUPE_WINDOW_MS = 4 * 60 * 60 * 1000;
const WEBHOOK_SCOPE = 'webhooks:write';

export type FigmaEventType = 'FILE_COMMENT' | 'FILE_VERSION_UPDATE' | 'FILE_UPDATE' | 'FILE_DELETE' | 'LIBRARY_PUBLISH';
export type FigmaWebhookContext = 'team' | 'project' | 'file';

const contextProp = Property.StaticDropdown({
  displayName: 'Watch',
  description: 'Whether to watch every file in a team, every file in a project, or one file. Team webhooks need a team admin; project and file webhooks need edit access.',
  required: false,
  defaultValue: 'team',
  options: {
    disabled: false,
    options: [
      { label: 'Team', value: 'team' },
      { label: 'Project', value: 'project' },
      { label: 'File', value: 'file' },
    ],
  },
});

function contextIdProp({ displayName }: { displayName: string }) {
  return Property.ShortText({
    displayName,
    description:
      'For Team or Project, the number after /team/ or /project/ in the Figma URL (e.g. figma.com/files/team/1234567890). For File, the file URL or file key.',
    required: true,
  });
}

function resolveContext({ context, contextId }: { context: unknown; contextId: unknown }): { context: FigmaWebhookContext; contextId: string } {
  const kind: FigmaWebhookContext = context === 'project' || context === 'file' ? context : 'team';
  if (kind === 'file') {
    return { context: kind, contextId: figmaClient.parseFileKey(contextId).mainFileKey };
  }
  const text = typeof contextId === 'string' ? contextId.trim() : typeof contextId === 'number' ? String(contextId) : '';
  const fromUrl = /\/(?:team|project)\/(\d+)/.exec(text)?.[1];
  const id = /^\d+$/.test(text) ? text : fromUrl;
  if (id === undefined) {
    throw new Error(`${kind === 'team' ? 'Team' : 'Project'} ID must be the number from the Figma ${kind} URL.`);
  }
  return { context: kind, contextId: id };
}

async function enable({
  auth,
  eventType,
  context,
  contextId,
  webhookUrl,
  store,
}: {
  auth: unknown;
  eventType: FigmaEventType;
  context: unknown;
  contextId: unknown;
  webhookUrl: string;
  store: WebhookStore;
}): Promise<void> {
  const target = resolveContext({ context, contextId });
  const passcode = randomBytes(32).toString('hex');
  const response = await figmaClient.request<Record<string, unknown>>({
    auth,
    method: HttpMethod.POST,
    path: '/v2/webhooks',
    body: {
      event_type: eventType,
      context: target.context,
      context_id: target.contextId,
      endpoint: webhookUrl,
      passcode,
      description: 'Activepieces',
    },
    redactBody: true,
    scope: WEBHOOK_SCOPE,
    tier: 2,
    operation: 'create the webhook',
  });
  const rawId = figmaClient.isRecord(response.body) ? response.body['id'] : undefined;
  const webhookId = typeof rawId === 'string' || typeof rawId === 'number' ? String(rawId) : '';
  if (webhookId === '') {
    throw new Error('Figma did not return the ID of the created webhook.');
  }
  try {
    await store.put(WEBHOOK_KEY, { webhookId, passcodeHash: hash(passcode) });
  } catch (error) {
    await deleteWebhook({ auth, webhookId }).catch(() => undefined);
    throw error;
  }
}

async function disable({ auth, store }: { auth: unknown; store: WebhookStore }): Promise<void> {
  const current = await store.get<unknown>(WEBHOOK_KEY);
  const legacy = await store.get<unknown>(LEGACY_KEY);
  for (const entry of [current, legacy]) {
    const webhookId = figmaClient.isRecord(entry) && typeof entry['webhookId'] === 'string' ? entry['webhookId'] : '';
    if (webhookId !== '') {
      await deleteWebhook({ auth, webhookId });
    }
  }
  await store.delete(WEBHOOK_KEY);
  await store.delete(LEGACY_KEY);
  await Promise.all(Array.from({ length: SLOT_COUNT }, (_, slot) => store.delete(`${SLOT_KEY_PREFIX}${slot}`)));
}

async function deleteWebhook({ auth, webhookId }: { auth: unknown; webhookId: string }): Promise<void> {
  try {
    await figmaClient.request({
      auth,
      method: HttpMethod.DELETE,
      path: `/v2/webhooks/${figmaClient.segment({ value: webhookId, label: 'Webhook ID' })}`,
      scope: WEBHOOK_SCOPE,
      tier: 2,
      operation: 'delete the webhook',
    });
  } catch (error) {
    if (error instanceof FigmaApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

async function receive({ body, eventType, store, now = Date.now() }: { body: unknown; eventType: FigmaEventType; store: WebhookStore; now?: number }): Promise<unknown[]> {
  if (!figmaClient.isRecord(body)) return [];
  const stored = await store.get<unknown>(WEBHOOK_KEY);
  if (figmaClient.isRecord(stored) && typeof stored['passcodeHash'] === 'string') {
    if (!passcodeMatches({ given: body['passcode'], expectedHash: stored['passcodeHash'] })) return [];
  } else if ((await store.get<unknown>(LEGACY_KEY)) === null) {
    return [];
  }
  if (body['event_type'] !== eventType) return [];
  const eventId = eventIdOf({ body, eventType });
  const claimed = await claimEvent({ store, eventId, now });
  if (!claimed) return [];
  const { passcode: _passcode, ...event } = body;
  return [{ ...event, [DEDUPE_KEY_PROPERTY]: `figma:${eventId}` }];
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function passcodeMatches({ given, expectedHash }: { given: unknown; expectedHash: string }): boolean {
  if (typeof given !== 'string' || given === '') return false;
  const actual = Buffer.from(hash(given), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function eventIdOf({ body, eventType }: { body: Record<string, unknown>; eventType: FigmaEventType }): string {
  const webhook = text(body['webhook_id']);
  const file = text(body['file_key']);
  if (eventType === 'FILE_COMMENT') return `${webhook}:${eventType}:${text(body['comment_id'])}`;
  if (eventType === 'FILE_VERSION_UPDATE') return `${webhook}:${eventType}:${file}:${text(body['version_id'])}`;
  if (eventType === 'FILE_DELETE') return `${webhook}:${eventType}:${file}:${text(body['timestamp'])}`;
  if (eventType === 'LIBRARY_PUBLISH') return `${webhook}:${eventType}:${file}:${text(body['timestamp'])}:${libraryChangesHash(body)}`;
  return `${webhook}:${eventType}:${file}:${text(body['timestamp'])}`;
}

// Figma splits one publish into several LIBRARY_PUBLISH events (per asset type, and again when large)
// that share a whole-second timestamp. Hashing the change lists keeps each part distinct, while a
// retry resends the same body and still collapses.
function libraryChangesHash(body: Record<string, unknown>): string {
  const changes = LIBRARY_CHANGE_FIELDS.map((field) => [field, body[field] ?? null]);
  return hash(JSON.stringify(changes));
}

const LIBRARY_CHANGE_FIELDS = [
  'created_components',
  'modified_components',
  'deleted_components',
  'created_styles',
  'modified_styles',
  'deleted_styles',
  'created_variables',
  'modified_variables',
  'deleted_variables',
];

async function claimEvent({ store, eventId, now }: { store: WebhookStore; eventId: string; now: number }): Promise<boolean> {
  const key = slotKey(eventId);
  const before = await readSlot({ store, key, now });
  if (before.some((entry) => entry.id === eventId)) return false;
  const mine: SeenEvent = { id: eventId, at: now, token: randomBytes(16).toString('hex') };
  await store.put(key, [...before.slice(-(MAX_PER_SLOT - 1)), mine]);
  const after = await readSlot({ store, key, now });
  const winner = after.find((entry) => entry.id === eventId);
  if (winner !== undefined) return winner.token === mine.token;
  await store.put(key, [...after.slice(-(MAX_PER_SLOT - 1)), mine]);
  return true;
}

async function readSlot({ store, key, now }: { store: WebhookStore; key: string; now: number }): Promise<SeenEvent[]> {
  const stored = await store.get<unknown>(key);
  return (Array.isArray(stored) ? stored : []).filter(
    (entry): entry is SeenEvent =>
      figmaClient.isRecord(entry) &&
      typeof entry['id'] === 'string' &&
      typeof entry['token'] === 'string' &&
      typeof entry['at'] === 'number' &&
      now - entry['at'] < DEDUPE_WINDOW_MS,
  );
}

function slotKey(eventId: string): string {
  return `${SLOT_KEY_PREFIX}${createHash('sha256').update(eventId).digest().readUInt32BE(0) % SLOT_COUNT}`;
}

export const figmaWebhook = { enable, disable, receive, resolveContext, contextProp, contextIdProp, DEDUPE_WINDOW_MS };

export type WebhookStore = {
  put: (key: string, value: unknown) => Promise<unknown>;
  get: <T>(key: string) => Promise<T | null>;
  delete: (key: string) => Promise<void>;
};

type SeenEvent = { id: string; at: number; token: string };
