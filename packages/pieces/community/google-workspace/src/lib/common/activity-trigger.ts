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
      });
      await closeChannel({ auth: context.auth, channel: previous });
    },

    async onDisable(context) {
      const previous = await context.store.get<StoredChannel>(STORE_KEY);
      await closeChannel({ auth: context.auth, channel: previous });
      await context.store.delete(STORE_KEY);
    },

    async run(context) {
      const { headers, body } = context.payload;
      const stored = await context.store.get<StoredChannel>(STORE_KEY);

      const token = headerOf({ headers, name: 'x-goog-channel-token' });
      if (!stored || !token || token !== stored.token) {
        return [];
      }
      if (headerOf({ headers, name: 'x-goog-resource-state' }) === 'sync' || !isActivity(body)) {
        return [];
      }

      return flattenActivity(body).filter((event) => accepts({ event, props: context.propsValue }));
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
}: {
  auth: GoogleWorkspaceAuthValue | undefined;
  query: ActivityQuery;
  webhookUrl: string;
  store: Store;
}): Promise<StoredChannel> {
  const resolved = await resolveAuth(auth);
  const request = newChannelRequest({ address: webhookUrl });
  const channel = await ReportsApi.watch({ auth: resolved, query, channel: request });
  const stored: StoredChannel = { ...channel, id: channel.id ?? request.id, token: request.token, query };
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

type StoredChannel = Channel & { token: string; query: ActivityQuery };

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
