import { randomUUID } from 'node:crypto';

import { HttpMethod } from '@activepieces/pieces-common';
import {
  createTrigger,
  DEDUPE_KEY_PROPERTY,
  TriggerStrategy,
  WebhookRenewStrategy,
} from '@activepieces/pieces-framework';
import type {
  ActionClassification,
  AiMetadata,
  InputPropertyMap,
  StaticPropsValue,
  Store,
} from '@activepieces/pieces-framework';

import { googleWorkspaceAuth } from '../auth';
import { activityEventOutputSchema } from '../output-schemas';
import { googleWorkspaceClient } from './client';
import { googleWorkspaceUtils } from './utils';

import type {
  GoogleWorkspaceActivity,
  GoogleWorkspaceActivityEvent,
  GoogleWorkspaceActivityParameter,
  GoogleWorkspaceActivityQuery,
  GoogleWorkspaceAuthValue,
  GoogleWorkspaceChannel,
  GoogleWorkspaceChannelRequest,
  GoogleWorkspaceResolvedAuth,
} from './types';

function createActivityTrigger<Props extends InputPropertyMap>(spec: ActivityTriggerSpec<Props>) {
  const accepts = ({
    event,
    props,
  }: {
    event: GoogleWorkspaceActivityEvent;
    props: StaticPropsValue<Props>;
  }) => (spec.accept ? spec.accept({ event, props }) : true);

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
      const failures = await stopChannels({
        auth: context.auth,
        store: context.store,
        keys,
        channels: [stale],
      });
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
        failOnUnstopped(
          await stopChannels({
            auth: context.auth,
            store: context.store,
            keys,
            channels: [current],
          }),
        );
      }
    },

    async onDisable(context) {
      const keys = channelKeys(context.flows.current.version.id);
      await context.store.put(keys.disabled, true);
      const current = await context.store.get<StoredChannel>(keys.channel);
      failOnUnstopped(
        await stopChannels({ auth: context.auth, store: context.store, keys, channels: [current] }),
      );
      await clearStore({ store: context.store, keys });
    },

    async run(context) {
      const { headers, body } = context.payload;
      const token = headerOf({ headers, name: 'x-goog-channel-token' });
      if (
        !token ||
        headerOf({ headers, name: 'x-goog-resource-state' }) === 'sync' ||
        !isActivity(body)
      ) {
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
      const activities = await reports.listActivities({
        auth: await googleWorkspaceClient.resolveAuth(context.auth),
        query: { ...query, maxResults: 50 },
      });
      const events = activities
        .flatMap(flattenActivity)
        .filter((event) => accepts({ event, props: context.propsValue }));
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

async function isKnownToken({
  store,
  keys,
  token,
  now,
}: {
  store: Store;
  keys: ChannelKeys;
  token: string;
  now: number;
}): Promise<boolean> {
  const current = await store.get<StoredChannel>(keys.channel);
  if (current?.token === token) {
    return true;
  }
  const pending = await store.get<string>(keys.pendingToken);
  if (pending === token) {
    return true;
  }
  const previous = await store.get<PreviousChannel>(keys.previousChannel);
  return (
    previous?.previousToken === token && now - previous.previousStoppedAt < IN_FLIGHT_WINDOW_MS
  );
}

function headerOf({
  headers,
  name,
}: {
  headers: Record<string, string> | undefined;
  name: string;
}): string | undefined {
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
  query: GoogleWorkspaceActivityQuery;
  webhookUrl: string;
  store: Store;
  keys: ChannelKeys;
  replacing?: StoredChannel | null;
}): Promise<boolean> {
  const resolved = await googleWorkspaceClient.resolveAuth(auth);
  const request = newChannelRequest({ address: webhookUrl });
  await store.put(keys.pendingToken, request.token);
  const channel = await watchOrRollback({
    store,
    keys,
    token: request.token,
    watch: () => reports.watch({ auth: resolved, query, channel: request }),
  });
  const opened: StoredChannel = {
    ...channel,
    id: channel.id ?? request.id,
    token: request.token,
    query,
  };
  const latest = await store.get<StoredChannel>(keys.channel);
  if (!isSameChannel({ a: latest, b: replacing })) {
    await deletePendingToken({ store, keys, token: request.token });
    failOnUnstopped(await stopChannels({ auth, store, keys, channels: [opened] }));
    return false;
  }
  if (replacing) {
    const previous: PreviousChannel = {
      previousToken: replacing.token,
      previousStoppedAt: Date.now(),
    };
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

async function deletePendingToken({
  store,
  keys,
  token,
}: {
  store: Store;
  keys: ChannelKeys;
  token: string;
}): Promise<void> {
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
  watch: () => Promise<GoogleWorkspaceChannel>;
}): Promise<GoogleWorkspaceChannel> {
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
  await store.put(
    keys.unstoppedChannels,
    failures.map(({ channel }) => channel),
  );
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
  return `Could not stop the Google Workspace notification channel(s) ${ids}: ${
    failures[0]?.reason ?? 'unknown error'
  }. They are kept for another stop attempt the next time this trigger is enabled, renewed or disabled; either way Google expires them within 6 hours.`;
}

async function stopEach({
  auth,
  targets,
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  targets: ChannelRef[];
}): Promise<StopFailure[]> {
  if (targets.length === 0) return [];
  let resolved: GoogleWorkspaceResolvedAuth;
  try {
    resolved = await googleWorkspaceClient.resolveAuth(auth);
  } catch (error) {
    return targets.map((channel) => ({ channel, reason: describe(error) }));
  }
  const failures: StopFailure[] = [];
  for (const channel of targets) {
    try {
      await reports.stop({ auth: resolved, channel });
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
  return refs.filter(
    (ref, index) =>
      refs.findIndex((other) => other.id === ref.id && other.resourceId === ref.resourceId) ===
      index,
  );
}

function isGone(error: unknown): boolean {
  return error instanceof googleWorkspaceClient.ApiError && GONE_STATUSES.includes(error.status);
}

function describe(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, MAX_REASON_LENGTH);
}

async function clearStore({ store, keys }: { store: Store; keys: ChannelKeys }): Promise<void> {
  await store.delete(keys.channel);
  await store.delete(keys.pendingToken);
  await store.delete(keys.previousChannel);
}

function newChannelRequest({
  address,
  now = Date.now(),
}: {
  address: string;
  now?: number;
}): GoogleWorkspaceChannelRequest {
  return {
    id: randomUUID(),
    address,
    token: randomUUID(),
    expiration: now + CHANNEL_MAX_LIFETIME_MS,
  };
}

function flattenActivity(activity: GoogleWorkspaceActivity): GoogleWorkspaceActivityEvent[] {
  const events = activity.events ?? [];
  const base = `${activity.id?.time ?? ''}:${activity.id?.uniqueQualifier ?? ''}`;
  return events.map((event, index) => ({
    id: events.length > 1 ? `${base}:${index}` : base,
    time: activity.id?.time ?? null,
    application: activity.id?.applicationName ?? null,
    eventType: event.type ?? null,
    eventName: event.name ?? null,
    actor: {
      email: activity.actor?.email ?? null,
      profileId: activity.actor?.profileId ?? null,
      callerType: activity.actor?.callerType ?? null,
    },
    ipAddress: activity.ipAddress ?? null,
    ownerDomain: activity.ownerDomain ?? null,
    parameters: Object.fromEntries(
      (event.parameters ?? []).flatMap((p): [string, unknown][] =>
        p.name ? [[p.name, parameterValue(p)]] : [],
      ),
    ),
    activity,
  }));
}

function isActivity(body: unknown): body is GoogleWorkspaceActivity {
  return (
    typeof body === 'object' && body !== null && 'events' in body && Array.isArray(body.events)
  );
}

function activityPath({
  query,
  suffix = '',
}: {
  query: GoogleWorkspaceActivityQuery;
  suffix?: string;
}): string {
  const userKey = encodeURIComponent((query.userKey ?? 'all').trim() || 'all');
  return `${
    googleWorkspaceUtils.reportsPath
  }/activity/users/${userKey}/applications/${encodeURIComponent(query.application)}${suffix}`;
}

function queryParams(
  query: GoogleWorkspaceActivityQuery,
): Record<string, string | number | undefined> {
  return {
    eventName: query.eventName?.trim() || undefined,
    filters: query.filters?.trim() || undefined,
    startTime: query.startTime,
    maxResults: query.maxResults,
  };
}

function parameterValue(p: GoogleWorkspaceActivityParameter): unknown {
  if (p.value !== undefined) return p.value;
  if (p.intValue !== undefined) return p.intValue;
  if (p.boolValue !== undefined) return p.boolValue;
  if (p.multiValue !== undefined) return p.multiValue;
  if (p.multiIntValue !== undefined) return p.multiIntValue;
  if (p.messageValue !== undefined) return p.messageValue;
  if (p.multiMessageValue !== undefined) return p.multiMessageValue;
  return null;
}

async function listActivities({
  auth,
  query,
}: {
  auth: GoogleWorkspaceResolvedAuth;
  query: GoogleWorkspaceActivityQuery;
}): Promise<GoogleWorkspaceActivity[]> {
  const { items } = await googleWorkspaceClient.listPage<GoogleWorkspaceActivity>({
    auth,
    path: activityPath({ query }),
    itemsKey: 'items',
    query: queryParams(query),
  });
  return items;
}

async function watch({
  auth,
  query,
  channel,
}: {
  auth: GoogleWorkspaceResolvedAuth;
  query: GoogleWorkspaceActivityQuery;
  channel: GoogleWorkspaceChannelRequest;
}): Promise<GoogleWorkspaceChannel> {
  return await googleWorkspaceClient.request<GoogleWorkspaceChannel>({
    auth,
    method: HttpMethod.POST,
    path: activityPath({ query, suffix: '/watch' }),
    query: queryParams(query),
    body: {
      id: channel.id,
      type: 'web_hook',
      address: channel.address,
      token: channel.token,
      expiration: String(channel.expiration),
      payload: true,
    },
  });
}

async function stop({
  auth,
  channel,
}: {
  auth: GoogleWorkspaceResolvedAuth;
  channel: Pick<GoogleWorkspaceChannel, 'id' | 'resourceId'>;
}): Promise<void> {
  await googleWorkspaceClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: 'admin/reports_v1/channels/stop',
    body: { id: channel.id, resourceId: channel.resourceId },
  });
}

const reports = { listActivities, watch, stop };

const CHANNEL_MAX_LIFETIME_MS = (6 * 60 - 5) * 60 * 1000;
const CHANNEL_RENEW_CRON = '0 */4 * * *';

const SAMPLE_EVENT: GoogleWorkspaceActivityEvent = {
  id: '2026-10-05T12:34:56.789Z:8721456339812',
  time: '2026-10-05T12:34:56.789Z',
  application: 'admin',
  eventType: 'USER_SETTINGS',
  eventName: 'CREATE_USER',
  actor: { email: 'admin@example.com', profileId: '104938271650192837465', callerType: 'USER' },
  ipAddress: '203.0.113.10',
  ownerDomain: 'example.com',
  parameters: { USER_EMAIL: 'jane.doe@example.com' },
  activity: {
    kind: 'admin#reports#activity',
    id: {
      time: '2026-10-05T12:34:56.789Z',
      uniqueQualifier: '8721456339812',
      applicationName: 'admin',
      customerId: 'C01abcd2e',
    },
    actor: { email: 'admin@example.com', profileId: '104938271650192837465', callerType: 'USER' },
    ownerDomain: 'example.com',
    ipAddress: '203.0.113.10',
    events: [
      {
        type: 'USER_SETTINGS',
        name: 'CREATE_USER',
        parameters: [{ name: 'USER_EMAIL', value: 'jane.doe@example.com' }],
      },
    ],
  },
};

const KEY_PREFIX = 'google-workspace';
const GONE_STATUSES = [404, 410];
const MAX_REASON_LENGTH = 300;
const TEST_SAMPLE_SIZE = 10;
const IN_FLIGHT_WINDOW_MS = 2 * 60 * 1000;

export const googleWorkspaceActivityTrigger = {
  create: createActivityTrigger,
  reports,
  newChannelRequest,
  flattenActivity,
  isActivity,
  sampleEvent: SAMPLE_EVENT,
  channelMaxLifetimeMs: CHANNEL_MAX_LIFETIME_MS,
  renewCron: CHANNEL_RENEW_CRON,
};

type StoredChannel = GoogleWorkspaceChannel & {
  token: string;
  query: GoogleWorkspaceActivityQuery;
};
type PreviousChannel = { previousToken: string; previousStoppedAt: number };
type ChannelKeys = {
  channel: string;
  pendingToken: string;
  previousChannel: string;
  unstoppedChannels: string;
  disabled: string;
};
type ChannelRef = Pick<GoogleWorkspaceChannel, 'id' | 'resourceId'>;
type StopFailure = { channel: ChannelRef; reason: string };

type ActivityTriggerSpec<Props extends InputPropertyMap> = {
  name: string;
  classification: ActionClassification;
  displayName: string;
  description: string;
  aiMetadata: AiMetadata;
  props: Props;
  query: (props: StaticPropsValue<Props>) => GoogleWorkspaceActivityQuery;
  accept?: (params: {
    event: GoogleWorkspaceActivityEvent;
    props: StaticPropsValue<Props>;
  }) => boolean;
};
