import { createTrigger, TriggerStrategy, WebhookRenewStrategy } from '@activepieces/pieces-framework';
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
      await context.store.delete(SEEN_KEY);
    },

    async run(context) {
      const { headers, body } = context.payload;
      const stored = await context.store.get<StoredChannel>(STORE_KEY);

      const token = headerOf({ headers, name: 'x-goog-channel-token' });
      if (!stored || !token || !acceptsToken({ stored, token, now: Date.now() })) {
        return [];
      }
      if (headerOf({ headers, name: 'x-goog-resource-state' }) === 'sync' || !isActivity(body)) {
        return [];
      }

      const events = flattenActivity(body).filter((event) => accepts({ event, props: context.propsValue }));
      return dropSeenEvents({ store: context.store, events });
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

function acceptsToken({ stored, token, now }: { stored: StoredChannel; token: string; now: number }): boolean {
  if (token === stored.token) return true;
  return token === stored.previousToken && inOverlap({ stored, now });
}

function inOverlap({ stored, now }: { stored: StoredChannel; now: number }): boolean {
  return stored.previousToken !== undefined && now < (stored.previousTokenValidUntil ?? 0);
}

async function dropSeenEvents({ store, events }: { store: Store; events: ActivityEvent[] }): Promise<ActivityEvent[]> {
  const unique = uniqueById(events);
  if (unique.length === 0) return [];
  const seen = (await store.get<string[]>(SEEN_KEY)) ?? [];
  const seenSet = new Set(seen);
  const fresh = unique.filter((event) => !seenSet.has(event.id));
  if (fresh.length > 0) {
    await rememberEventIds({ store, seen, ids: fresh.map((event) => event.id) });
  }
  return fresh;
}

async function rememberEventIds({ store, seen, ids }: { store: Store; seen: string[]; ids: string[] }): Promise<void> {
  let current = seen;
  for (let attempt = 0; attempt < MAX_SEEN_WRITE_ATTEMPTS; attempt++) {
    const merged = mergeIds({ current, ids });
    await store.put(SEEN_KEY, merged);
    const stored = new Set((await store.get<string[]>(SEEN_KEY)) ?? []);
    const kept = merged.filter((id) => ids.includes(id));
    if (kept.every((id) => stored.has(id))) return;
    current = [...stored];
  }
}

function mergeIds({ current, ids }: { current: string[]; ids: string[] }): string[] {
  const added = new Set(ids);
  return [...current.filter((id) => !added.has(id)), ...ids].slice(-MAX_SEEN_EVENTS);
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
  const channel = await ReportsApi.watch({ auth: resolved, query, channel: request });
  const stored: StoredChannel = {
    ...channel,
    id: channel.id ?? request.id,
    token: request.token,
    query,
    ...(previous ? { previousToken: previous.token, previousTokenValidUntil: Date.now() + PREVIOUS_TOKEN_GRACE_MS } : {}),
  };
  await store.put(STORE_KEY, stored);
  return stored;
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
const TEST_SAMPLE_SIZE = 10;
const SEEN_KEY = 'google-workspace:seen-events';
const MAX_SEEN_EVENTS = 500;
const MAX_SEEN_WRITE_ATTEMPTS = 3;
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
