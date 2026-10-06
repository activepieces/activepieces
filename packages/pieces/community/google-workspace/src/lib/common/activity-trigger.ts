import { createHash } from 'node:crypto';

import { createTrigger, DEDUPE_KEY_PROPERTY, TriggerStrategy, WebhookRenewStrategy } from '@activepieces/pieces-framework';
import type { ActionClassification, AiMetadata, InputPropertyMap, StaticPropsValue, Store } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { activityEventOutputSchema } from '../output-schemas';
import { CHANNEL_RENEW_CRON, ReportsApi, SAMPLE_EVENT, flattenActivity, isActivity, newChannelRequest } from './activities';
import type { ActivityEvent, ActivityQuery, Channel } from './activities';
import { resolveAuth } from './token';
import type { GoogleWorkspaceAuthValue } from './token';

export function createActivityTrigger<Props extends InputPropertyMap>(spec: ActivityTriggerSpec<Props>) {
  const accepts = ({ event, props }: { event: ActivityEvent; props: StaticPropsValue<Props> }) =>
    spec.accept ? spec.accept({ event, props }) : true;

  return createTrigger({
    name: spec.name,
    classification: spec.classification,
    displayName: spec.displayName,
    description: spec.description,
    aiMetadata: spec.aiMetadata,
    auth: googleWorkspaceAuth,
    props: spec.props,
    type: TriggerStrategy.WEBHOOK,
    renewConfiguration: { strategy: WebhookRenewStrategy.CRON, cronExpression: CHANNEL_RENEW_CRON },
    sampleData: SAMPLE_EVENT,
    outputSchema: activityEventOutputSchema,

    async onEnable(context) {
      const previous = await context.store.get<StoredChannel>(STORE_KEY);
      await closeChannel({ auth: context.auth, channel: previous });
      await context.store.delete(LEGACY_SEEN_KEY);
      await openChannel({
        auth: context.auth,
        query: spec.query(context.propsValue),
        webhookUrl: context.webhookUrl,
        store: context.store,
      });
    },

    async onRenew(context) {
      const previous = await context.store.get<StoredChannel>(STORE_KEY);
      await openChannel({
        auth: context.auth,
        query: previous?.query ?? spec.query(context.propsValue),
        webhookUrl: context.webhookUrl,
        store: context.store,
        previous,
      });
      await closeChannel({ auth: context.auth, channel: previous });
    },

    async onDisable(context) {
      const previous = await context.store.get<StoredChannel>(STORE_KEY);
      await closeChannel({ auth: context.auth, channel: previous });
      await context.store.delete(STORE_KEY);
      await context.store.delete(PENDING_TOKEN_KEY);
      await forgetSeenEvents({ store: context.store });
    },

    async run(context) {
      const { headers, body } = context.payload;
      const token = headerOf({ headers, name: 'x-goog-channel-token' });
      if (!token || !(await isKnownToken({ store: context.store, token, now: Date.now() }))) {
        return [];
      }
      if (headerOf({ headers, name: 'x-goog-resource-state' }) === 'sync' || !isActivity(body)) {
        return [];
      }

      const events = flattenActivity(body).filter((event) => accepts({ event, props: context.propsValue }));
      const fresh = await dropSeenEvents({ store: context.store, events });
      return fresh.map((event) => ({ ...event, [DEDUPE_KEY_PROPERTY]: event.id }));
    },

    async test(context) {
      const query = spec.query(context.propsValue);
      const activities = await ReportsApi.listActivities({
        auth: await resolveAuth(context.auth),
        query: { ...query, maxResults: 50 },
      });
      const events = activities.flatMap(flattenActivity).filter((event) => accepts({ event, props: context.propsValue }));
      return events.slice(0, TEST_SAMPLE_SIZE);
    },
  });
}

async function isKnownToken({ store, token, now }: { store: Store; token: string; now: number }): Promise<boolean> {
  const pending = await store.get<string>(PENDING_TOKEN_KEY);
  if (pending !== null && token === pending) return true;
  const stored = await store.get<StoredChannel>(STORE_KEY);
  if (!stored) return false;
  if (token === stored.token) return true;
  return token === stored.previousToken && inOverlap({ stored, now });
}

function inOverlap({ stored, now }: { stored: StoredChannel; now: number }): boolean {
  return stored.previousToken !== undefined && now < (stored.previousTokenValidUntil ?? 0);
}

async function dropSeenEvents({ store, events }: { store: Store; events: ActivityEvent[] }): Promise<ActivityEvent[]> {
  const unique = uniqueById(events);
  if (unique.length === 0) return [];
  const legacy = new Set((await store.get<string[]>(LEGACY_SEEN_KEY)) ?? []);
  const checked = await Promise.all(
    unique.map(async (event) => {
      const digest = digestOf(event.id);
      const seen = legacy.has(event.id) || (await store.get<number>(seenKeyOf(digest))) !== null;
      return { event, digest, seen };
    }),
  );
  const fresh = checked.filter((entry) => !entry.seen);
  if (fresh.length === 0) return [];
  const now = Date.now();
  await Promise.all(fresh.map((entry) => store.put(seenKeyOf(entry.digest), now)));
  await indexSeenEvents({ store, digests: fresh.map((entry) => entry.digest) });
  return fresh.map((entry) => entry.event);
}

async function indexSeenEvents({ store, digests }: { store: Store; digests: string[] }): Promise<void> {
  const added = new Set(digests);
  const current = (await store.get<string[]>(SEEN_INDEX_KEY)) ?? [];
  const merged = [...current.filter((digest) => !added.has(digest)), ...digests];
  const overflow = Math.max(0, merged.length - MAX_SEEN_EVENTS);
  await store.put(SEEN_INDEX_KEY, merged.slice(overflow));
  await Promise.all(merged.slice(0, overflow).map((digest) => store.delete(seenKeyOf(digest))));
}

async function forgetSeenEvents({ store }: { store: Store }): Promise<void> {
  const index = (await store.get<string[]>(SEEN_INDEX_KEY)) ?? [];
  await Promise.all(index.map((digest) => store.delete(seenKeyOf(digest))));
  await store.delete(SEEN_INDEX_KEY);
  await store.delete(LEGACY_SEEN_KEY);
}

function digestOf(eventId: string): string {
  return createHash('sha256').update(eventId).digest('hex');
}

function seenKeyOf(digest: string): string {
  return `${SEEN_KEY_PREFIX}${digest}`;
}

function uniqueById(events: ActivityEvent[]): ActivityEvent[] {
  const ids = new Set<string>();
  return events.filter((event) => {
    if (ids.has(event.id)) return false;
    ids.add(event.id);
    return true;
  });
}

function headerOf({ headers, name }: { headers: Record<string, string> | undefined; name: string }): string | undefined {
  if (!headers) return undefined;
  const wanted = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === wanted);
  return entry?.[1];
}

async function openChannel({
  auth,
  query,
  webhookUrl,
  store,
  previous,
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  query: ActivityQuery;
  webhookUrl: string;
  store: Store;
  previous?: StoredChannel | null;
}): Promise<StoredChannel> {
  const resolved = await resolveAuth(auth);
  const request = newChannelRequest({ address: webhookUrl });
  await store.put(PENDING_TOKEN_KEY, request.token);
  const channel = await watchOrRollback({ store, watch: () => ReportsApi.watch({ auth: resolved, query, channel: request }) });
  const stored: StoredChannel = {
    ...channel,
    id: channel.id ?? request.id,
    token: request.token,
    query,
    ...(previous ? { previousToken: previous.token, previousTokenValidUntil: Date.now() + PREVIOUS_TOKEN_GRACE_MS } : {}),
  };
  await store.put(STORE_KEY, stored);
  await store.delete(PENDING_TOKEN_KEY);
  return stored;
}

async function watchOrRollback({ store, watch }: { store: Store; watch: () => Promise<Channel> }): Promise<Channel> {
  try {
    return await watch();
  } catch (error) {
    await store.delete(PENDING_TOKEN_KEY);
    throw error;
  }
}

async function closeChannel({
  auth,
  channel,
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  channel: StoredChannel | null;
}): Promise<void> {
  if (!channel?.resourceId) return;
  try {
    await ReportsApi.stop({ auth: await resolveAuth(auth), channel });
  } catch {
    return;
  }
}

const STORE_KEY = 'google-workspace:channel';
const PENDING_TOKEN_KEY = 'google-workspace:pending-token';
const TEST_SAMPLE_SIZE = 10;
const LEGACY_SEEN_KEY = 'google-workspace:seen-events';
const SEEN_INDEX_KEY = 'google-workspace:seen-index';
const SEEN_KEY_PREFIX = 'google-workspace:seen:';
const MAX_SEEN_EVENTS = 500;
const PREVIOUS_TOKEN_GRACE_MS = 15 * 60 * 1000;

type StoredChannel = Channel & { token: string; query: ActivityQuery; previousToken?: string; previousTokenValidUntil?: number };

export type ActivityTriggerSpec<Props extends InputPropertyMap> = {
  name: string;
  classification: ActionClassification;
  displayName: string;
  description: string;
  aiMetadata: AiMetadata;
  props: Props;
  query: (props: StaticPropsValue<Props>) => ActivityQuery;
  accept?: (params: { event: ActivityEvent; props: StaticPropsValue<Props> }) => boolean;
};
