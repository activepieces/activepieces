import { createTrigger, DEDUPE_KEY_PROPERTY, TriggerStrategy, WebhookRenewStrategy } from '@activepieces/pieces-framework';
import type { ActionClassification, AiMetadata, InputPropertyMap, StaticPropsValue, Store } from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { activityEventOutputSchema } from '../output-schemas';
import { CHANNEL_RENEW_CRON, ReportsApi, SAMPLE_EVENT, flattenActivity, isActivity, newChannelRequest } from './activities';
import type { ActivityEvent, ActivityQuery, Channel } from './activities';
import { GoogleWorkspaceApiError } from './client';
import type { ResolvedAuth } from './client';
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
      const keys = channelKeys(context.flows.current.version.id);
      await context.store.delete(keys.disabled);
      const stale = await context.store.get<StoredChannel>(keys.channel);
      const failures = await stopChannels({ auth: context.auth, store: context.store, keys, channels: [stale] });
      await clearStore({ store: context.store, keys });
      warnOnUnstopped(failures);
      await openChannel({
        auth: context.auth,
        query: spec.query(context.propsValue),
        webhookUrl: context.webhookUrl,
        store: context.store,
        keys,
      });
    },

    async onRenew(context) {
      const keys = channelKeys(context.flows.current.version.id);
      const current = await context.store.get<StoredChannel>(keys.channel);
      const saved = await openChannel({
        auth: context.auth,
        query: current?.query ?? spec.query(context.propsValue),
        webhookUrl: context.webhookUrl,
        store: context.store,
        keys,
        replacing: current,
      });
      if (saved) {
        failOnUnstopped(await stopChannels({ auth: context.auth, store: context.store, keys, channels: [current] }));
      }
    },

    async onDisable(context) {
      const keys = channelKeys(context.flows.current.version.id);
      await context.store.put(keys.disabled, true);
      const current = await context.store.get<StoredChannel>(keys.channel);
      failOnUnstopped(await stopChannels({ auth: context.auth, store: context.store, keys, channels: [current] }));
      await clearStore({ store: context.store, keys });
    },

    async run(context) {
      const { headers, body } = context.payload;
      const token = headerOf({ headers, name: 'x-goog-channel-token' });
      if (!token || headerOf({ headers, name: 'x-goog-resource-state' }) === 'sync' || !isActivity(body)) {
        return [];
      }
      const keys = channelKeys(context.flows.current.version.id);
      if (!(await isKnownToken({ store: context.store, keys, token, now: Date.now() }))) {
        return [];
      }
      return flattenActivity(body)
        .filter((event) => accepts({ event, props: context.propsValue }))
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

function channelKeys(flowVersionId: string): ChannelKeys {
  return {
    channel: `${KEY_PREFIX}:channel:${flowVersionId}`,
    pendingToken: `${KEY_PREFIX}:pending-token:${flowVersionId}`,
    previousChannel: `${KEY_PREFIX}:previous-channel:${flowVersionId}`,
    unstoppedChannels: `${KEY_PREFIX}:unstopped-channels:${flowVersionId}`,
    disabled: `${KEY_PREFIX}:disabled:${flowVersionId}`,
  };
}

async function isKnownToken({ store, keys, token, now }: { store: Store; keys: ChannelKeys; token: string; now: number }): Promise<boolean> {
  const current = await store.get<StoredChannel>(keys.channel);
  if (current?.token === token) {
    return true;
  }
  const pending = await store.get<string>(keys.pendingToken);
  if (pending === token) {
    return true;
  }
  const previous = await store.get<PreviousChannel>(keys.previousChannel);
  return previous?.previousToken === token && now - previous.previousStoppedAt < IN_FLIGHT_WINDOW_MS;
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
  keys,
  replacing = null,
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  query: ActivityQuery;
  webhookUrl: string;
  store: Store;
  keys: ChannelKeys;
  replacing?: StoredChannel | null;
}): Promise<boolean> {
  const resolved = await resolveAuth(auth);
  const request = newChannelRequest({ address: webhookUrl });
  await store.put(keys.pendingToken, request.token);
  const channel = await watchOrRollback({
    store,
    keys,
    token: request.token,
    watch: () => ReportsApi.watch({ auth: resolved, query, channel: request }),
  });
  const opened: StoredChannel = { ...channel, id: channel.id ?? request.id, token: request.token, query };
  const latest = await store.get<StoredChannel>(keys.channel);
  if (!isSameChannel({ a: latest, b: replacing })) {
    await deletePendingToken({ store, keys, token: request.token });
    failOnUnstopped(await stopChannels({ auth, store, keys, channels: [opened] }));
    return false;
  }
  if (replacing) {
    const previous: PreviousChannel = { previousToken: replacing.token, previousStoppedAt: Date.now() };
    await store.put(keys.previousChannel, previous);
  }
  await store.put(keys.channel, opened);
  await deletePendingToken({ store, keys, token: request.token });
  if (await store.get<boolean>(keys.disabled)) {
    await store.delete(keys.channel);
    await store.delete(keys.previousChannel);
    failOnUnstopped(await stopChannels({ auth, store, keys, channels: [opened, replacing] }));
    return false;
  }
  return true;
}

function isSameChannel({ a, b }: { a: StoredChannel | null; b: StoredChannel | null }): boolean {
  return a?.id === b?.id && a?.token === b?.token;
}

async function deletePendingToken({ store, keys, token }: { store: Store; keys: ChannelKeys; token: string }): Promise<void> {
  if ((await store.get<string>(keys.pendingToken)) === token) {
    await store.delete(keys.pendingToken);
  }
}

async function watchOrRollback({
  store,
  keys,
  token,
  watch,
}: {
  store: Store;
  keys: ChannelKeys;
  token: string;
  watch: () => Promise<Channel>;
}): Promise<Channel> {
  try {
    return await watch();
  } catch (error) {
    await deletePendingToken({ store, keys, token });
    throw error;
  }
}

async function stopChannels({
  auth,
  store,
  keys,
  channels,
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  store: Store;
  keys: ChannelKeys;
  channels: (StoredChannel | null)[];
}): Promise<StopFailure[]> {
  const leftover = (await store.get<ChannelRef[]>(keys.unstoppedChannels)) ?? [];
  const targets = uniqueRefs([...channels.flatMap(toRef), ...leftover]);
  const failures = await stopEach({ auth, targets });
  if (failures.length === 0) {
    if (leftover.length > 0) {
      await store.delete(keys.unstoppedChannels);
    }
    return [];
  }
  await store.put(keys.unstoppedChannels, failures.map(({ channel }) => channel));
  return failures;
}

function failOnUnstopped(failures: StopFailure[]): void {
  if (failures.length > 0) {
    throw new Error(unstoppedMessage(failures));
  }
}

function warnOnUnstopped(failures: StopFailure[]): void {
  if (failures.length > 0) {
    console.warn(`${unstoppedMessage(failures)} The new channel was opened anyway.`);
  }
}

function unstoppedMessage(failures: StopFailure[]): string {
  const ids = failures.map(({ channel }) => channel.id).join(', ');
  return `Could not stop the Google Workspace notification channel(s) ${ids}: ${failures[0]?.reason ?? 'unknown error'}. They are kept for another stop attempt the next time this trigger is enabled, renewed or disabled; either way Google expires them within 6 hours.`;
}

async function stopEach({ auth, targets }: { auth: GoogleWorkspaceAuthValue | undefined; targets: ChannelRef[] }): Promise<StopFailure[]> {
  if (targets.length === 0) return [];
  let resolved: ResolvedAuth;
  try {
    resolved = await resolveAuth(auth);
  } catch (error) {
    return targets.map((channel) => ({ channel, reason: describe(error) }));
  }
  const failures: StopFailure[] = [];
  for (const channel of targets) {
    try {
      await ReportsApi.stop({ auth: resolved, channel });
    } catch (error) {
      if (!isGone(error)) {
        failures.push({ channel, reason: describe(error) });
      }
    }
  }
  return failures;
}

function toRef(channel: StoredChannel | null): ChannelRef[] {
  return channel?.resourceId ? [{ id: channel.id, resourceId: channel.resourceId }] : [];
}

function uniqueRefs(refs: ChannelRef[]): ChannelRef[] {
  return refs.filter((ref, index) => refs.findIndex((other) => other.id === ref.id && other.resourceId === ref.resourceId) === index);
}

function isGone(error: unknown): boolean {
  return error instanceof GoogleWorkspaceApiError && GONE_STATUSES.includes(error.status);
}

function describe(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, MAX_REASON_LENGTH);
}

async function clearStore({ store, keys }: { store: Store; keys: ChannelKeys }): Promise<void> {
  await store.delete(keys.channel);
  await store.delete(keys.pendingToken);
  await store.delete(keys.previousChannel);
}

const KEY_PREFIX = 'google-workspace';
const GONE_STATUSES = [404, 410];
const MAX_REASON_LENGTH = 300;
const TEST_SAMPLE_SIZE = 10;
const IN_FLIGHT_WINDOW_MS = 2 * 60 * 1000;

type StoredChannel = Channel & { token: string; query: ActivityQuery };
type PreviousChannel = { previousToken: string; previousStoppedAt: number };
type ChannelKeys = { channel: string; pendingToken: string; previousChannel: string; unstoppedChannels: string; disabled: string };
type ChannelRef = Pick<Channel, 'id' | 'resourceId'>;
type StopFailure = { channel: ChannelRef; reason: string };

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
