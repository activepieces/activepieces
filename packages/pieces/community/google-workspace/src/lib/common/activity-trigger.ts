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
      const stale = await context.store.get<StoredChannel>(STORE_KEY);
      await closeChannels({ auth: context.auth, channels: [stale, stale?.previous] });
      await context.store.delete(STORE_KEY);
      await context.store.delete(PENDING_TOKEN_KEY);
      await openChannel({
        auth: context.auth,
        query: spec.query(context.propsValue),
        webhookUrl: context.webhookUrl,
        store: context.store,
        current: null,
      });
    },

    async onRenew(context) {
      const current = await context.store.get<StoredChannel>(STORE_KEY);
      await openChannel({
        auth: context.auth,
        query: current?.query ?? spec.query(context.propsValue),
        webhookUrl: context.webhookUrl,
        store: context.store,
        current,
      });
      await closeChannels({ auth: context.auth, channels: [current?.previous] });
    },

    async onDisable(context) {
      const current = await context.store.get<StoredChannel>(STORE_KEY);
      await closeChannels({ auth: context.auth, channels: [current, current?.previous] });
      await context.store.delete(STORE_KEY);
      await context.store.delete(PENDING_TOKEN_KEY);
    },

    async run(context) {
      const { headers, body } = context.payload;
      const token = headerOf({ headers, name: 'x-goog-channel-token' });
      if (!token || headerOf({ headers, name: 'x-goog-resource-state' }) === 'sync' || !isActivity(body)) {
        return [];
      }
      const window = await deliveryWindow({ store: context.store, token, now: Date.now() });
      if (!window) {
        return [];
      }
      return flattenActivity(body)
        .filter((event) => inWindow({ window, time: event.time }) && accepts({ event, props: context.propsValue }))
        .map((event) => ({ ...event, [DEDUPE_KEY_PROPERTY]: event.id }));
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

async function deliveryWindow({ store, token, now }: { store: Store; token: string; now: number }): Promise<TimeWindow | null> {
  const stored = await store.get<StoredChannel>(STORE_KEY);
  if (!stored) {
    const pending = await store.get<string>(PENDING_TOKEN_KEY);
    return pending !== null && token === pending ? OPEN_WINDOW : null;
  }
  const previous = stored.previous && now < stored.previous.validUntil ? stored.previous : undefined;
  const cutover = parseTime(stored.cutoverAt);
  if (token === stored.token) {
    return previous && cutover !== null ? { from: cutover, timeRequired: false } : OPEN_WINDOW;
  }
  if (previous && token === previous.token && cutover !== null) {
    return { until: cutover, timeRequired: true };
  }
  if (previous || isLive({ channel: stored, now })) {
    return null;
  }
  const pending = await store.get<string>(PENDING_TOKEN_KEY);
  return pending !== null && token === pending ? OPEN_WINDOW : null;
}

function isLive({ channel, now }: { channel: Pick<Channel, 'expiration'>; now: number }): boolean {
  const expiresAt = parseExpiration(channel.expiration);
  return expiresAt === null || now < expiresAt;
}

function parseExpiration(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inWindow({ window, time }: { window: TimeWindow; time: string | null }): boolean {
  const at = parseTime(time);
  if (at === null) return !window.timeRequired;
  if (window.from !== undefined && at < window.from) return false;
  return window.until === undefined || at < window.until;
}

function parseTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
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
  current,
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  query: ActivityQuery;
  webhookUrl: string;
  store: Store;
  current: StoredChannel | null;
}): Promise<StoredChannel> {
  const resolved = await resolveAuth(auth);
  const request = newChannelRequest({ address: webhookUrl });
  await store.put(PENDING_TOKEN_KEY, request.token);
  const channel = await watchOrRollback({ store, watch: () => ReportsApi.watch({ auth: resolved, query, channel: request }) });
  const watchedAt = Date.now();
  const cutoverAt = cutoverOf({ watchedAt, current });
  const live = current && isLive({ channel: current, now: watchedAt }) ? current : null;
  const stored: StoredChannel = {
    ...channel,
    id: channel.id ?? request.id,
    token: request.token,
    query,
    cutoverAt: new Date(cutoverAt).toISOString(),
    ...(live ? { previous: previousOf({ channel: live, cutoverAt }) } : {}),
  };
  await store.put(STORE_KEY, stored);
  await store.delete(PENDING_TOKEN_KEY);
  return stored;
}

function cutoverOf({ watchedAt, current }: { watchedAt: number; current: StoredChannel | null }): number {
  const target = watchedAt + CUTOVER_SKEW_MS;
  const expiresAt = parseExpiration(current?.expiration);
  if (expiresAt === null || expiresAt >= target) return target;
  return Math.max(watchedAt, expiresAt);
}

function previousOf({ channel, cutoverAt }: { channel: StoredChannel; cutoverAt: number }): PreviousChannel {
  const expiresAt = parseExpiration(channel.expiration);
  return {
    id: channel.id,
    resourceId: channel.resourceId,
    token: channel.token,
    validUntil: expiresAt !== null && expiresAt > cutoverAt ? expiresAt : cutoverAt + PREVIOUS_TOKEN_GRACE_MS,
  };
}

async function watchOrRollback({ store, watch }: { store: Store; watch: () => Promise<Channel> }): Promise<Channel> {
  try {
    return await watch();
  } catch (error) {
    await store.delete(PENDING_TOKEN_KEY);
    throw error;
  }
}

async function closeChannels({
  auth,
  channels,
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  channels: (ChannelHandle | null | undefined)[];
}): Promise<void> {
  for (const channel of channels) {
    if (!channel?.resourceId) continue;
    try {
      await ReportsApi.stop({ auth: await resolveAuth(auth), channel: { id: channel.id, resourceId: channel.resourceId } });
    } catch {
      continue;
    }
  }
}

const STORE_KEY = 'google-workspace:channel';
const PENDING_TOKEN_KEY = 'google-workspace:pending-token';
const TEST_SAMPLE_SIZE = 10;
const PREVIOUS_TOKEN_GRACE_MS = 15 * 60 * 1000;
const CUTOVER_SKEW_MS = 60 * 1000;
const OPEN_WINDOW: TimeWindow = { timeRequired: false };

type TimeWindow = { from?: number; until?: number; timeRequired: boolean };
type ChannelHandle = Pick<Channel, 'id' | 'resourceId'>;
type PreviousChannel = ChannelHandle & { token: string; validUntil: number };
type StoredChannel = Channel & { token: string; query: ActivityQuery; cutoverAt: string; previous?: PreviousChannel };

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
