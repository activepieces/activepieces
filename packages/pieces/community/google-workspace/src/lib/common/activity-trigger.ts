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
      await stopChannel({ auth: context.auth, channel: stale });
      await clearStore(context.store);
      await openChannel({
        auth: context.auth,
        query: spec.query(context.propsValue),
        webhookUrl: context.webhookUrl,
        store: context.store,
      });
    },

    async onRenew(context) {
      const current = await context.store.get<StoredChannel>(STORE_KEY);
      const saved = await openChannel({
        auth: context.auth,
        query: current?.query ?? spec.query(context.propsValue),
        webhookUrl: context.webhookUrl,
        store: context.store,
        replacing: current,
      });
      if (saved) {
        await stopChannel({ auth: context.auth, channel: current });
      }
    },

    async onDisable(context) {
      const current = await context.store.get<StoredChannel>(STORE_KEY);
      await stopChannel({ auth: context.auth, channel: current });
      await clearStore(context.store);
    },

    async run(context) {
      const { headers, body } = context.payload;
      const token = headerOf({ headers, name: 'x-goog-channel-token' });
      if (!token || headerOf({ headers, name: 'x-goog-resource-state' }) === 'sync' || !isActivity(body)) {
        return [];
      }
      if (!(await isKnownToken({ store: context.store, token, now: Date.now() }))) {
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

async function isKnownToken({ store, token, now }: { store: Store; token: string; now: number }): Promise<boolean> {
  const current = await store.get<StoredChannel>(STORE_KEY);
  if (current?.token === token) {
    return true;
  }
  const pending = await store.get<string>(PENDING_TOKEN_KEY);
  if (pending === token) {
    return true;
  }
  const previous = await store.get<PreviousChannel>(PREVIOUS_KEY);
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
  replacing = null,
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  query: ActivityQuery;
  webhookUrl: string;
  store: Store;
  replacing?: StoredChannel | null;
}): Promise<boolean> {
  const resolved = await resolveAuth(auth);
  const request = newChannelRequest({ address: webhookUrl });
  await store.put(PENDING_TOKEN_KEY, request.token);
  const channel = await watchOrRollback({
    store,
    token: request.token,
    watch: () => ReportsApi.watch({ auth: resolved, query, channel: request }),
  });
  const opened: StoredChannel = { ...channel, id: channel.id ?? request.id, token: request.token, query };
  const latest = await store.get<StoredChannel>(STORE_KEY);
  if (!isSameChannel({ a: latest, b: replacing })) {
    await stopChannel({ auth, channel: opened });
    await deletePendingToken({ store, token: request.token });
    return false;
  }
  if (replacing) {
    const previous: PreviousChannel = { previousToken: replacing.token, previousStoppedAt: Date.now() };
    await store.put(PREVIOUS_KEY, previous);
  }
  await store.put(STORE_KEY, opened);
  await deletePendingToken({ store, token: request.token });
  return true;
}

function isSameChannel({ a, b }: { a: StoredChannel | null; b: StoredChannel | null }): boolean {
  return a?.id === b?.id && a?.token === b?.token;
}

async function deletePendingToken({ store, token }: { store: Store; token: string }): Promise<void> {
  if ((await store.get<string>(PENDING_TOKEN_KEY)) === token) {
    await store.delete(PENDING_TOKEN_KEY);
  }
}

async function watchOrRollback({
  store,
  token,
  watch,
}: {
  store: Store;
  token: string;
  watch: () => Promise<Channel>;
}): Promise<Channel> {
  try {
    return await watch();
  } catch (error) {
    await deletePendingToken({ store, token });
    throw error;
  }
}

async function stopChannel({ auth, channel }: { auth: GoogleWorkspaceAuthValue | undefined; channel: StoredChannel | null }): Promise<void> {
  if (!channel?.resourceId) return;
  try {
    await ReportsApi.stop({ auth: await resolveAuth(auth), channel: { id: channel.id, resourceId: channel.resourceId } });
  } catch {
    return;
  }
}

async function clearStore(store: Store): Promise<void> {
  await store.delete(STORE_KEY);
  await store.delete(PENDING_TOKEN_KEY);
  await store.delete(PREVIOUS_KEY);
}

const STORE_KEY = 'google-workspace:channel';
const PENDING_TOKEN_KEY = 'google-workspace:pending-token';
const PREVIOUS_KEY = 'google-workspace:previous-channel';
const TEST_SAMPLE_SIZE = 10;
const IN_FLIGHT_WINDOW_MS = 2 * 60 * 1000;

type StoredChannel = Channel & { token: string; query: ActivityQuery };
type PreviousChannel = { previousToken: string; previousStoppedAt: number };

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
