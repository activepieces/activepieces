import { randomUUID } from 'node:crypto';
import { WebhookRenewStrategy } from '@activepieces/pieces-framework';
import { ZOHO_WEBHOOK_TOKEN } from './constants';
import { formatDateTime } from './helpers';
import { BiginApiError, biginApiService, getBiginConnection, isObject } from './request';
import { biginRecords, BiginRecord } from './records';

const CHANNEL_LIFETIME_MS = 23 * 60 * 60 * 1000;
const MAX_FETCHED_RECORDS = 10;

function nextExpiry(): string {
  return formatDateTime(new Date(Date.now() + CHANNEL_LIFETIME_MS));
}

function readStoredChannel(value: unknown): StoredChannel | undefined {
  if (typeof value === 'string' && value !== '') {
    return { channel_id: value, token: ZOHO_WEBHOOK_TOKEN };
  }
  if (isObject(value) && typeof value['channel_id'] === 'string' && typeof value['token'] === 'string') {
    return { channel_id: value['channel_id'], token: value['token'] };
  }
  return undefined;
}

async function fetchNotifiedRecords({
  auth,
  module,
  ids,
}: {
  auth: { access_token: string; data: Record<string, unknown> };
  module: string;
  ids: string[];
}): Promise<NotifiedRecords> {
  const records: BiginRecord[] = [];
  try {
    const connection = getBiginConnection(auth);
    for (const id of ids.slice(0, MAX_FETCHED_RECORDS)) {
      const record = await biginRecords.find({ connection, module, id });
      if (record) records.push(record);
    }
    return { records };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { records, records_error: message };
  }
}

function sampleData({ module, event }: { module: string; event: 'create' | 'edit' }) {
  return {
    server_time: 1754252081534,
    query_params: {},
    module,
    resource_uri: `https://www.zohoapis.com/bigin/v2/${module}`,
    ids: ['6913232000000583260'],
    affected_fields: [],
    operation: event === 'create' ? 'insert' : 'update',
    channel_id: '1722705400',
    records: [
      {
        id: '6913232000000583260',
        Owner: { id: '6913232000000412001', name: 'Jane Doe', email: 'jane@example.com' },
        Created_Time: '2026-11-01T10:00:00+00:00',
        Modified_Time: '2026-11-01T10:00:00+00:00',
      },
    ],
  };
}

function hooks({
  module,
  event,
  storeKey,
}: {
  module: string;
  event: 'create' | 'edit';
  storeKey: string;
}) {
  const eventName = `${module}.${event}`;
  return {
    renewConfiguration: {
      strategy: WebhookRenewStrategy.CRON as const,
      cronExpression: '0 */6 * * *',
    },
    async onEnable(context: HookContext) {
      const channel_id = Date.now().toString();
      const token = randomUUID();
      const { accessToken, apiDomain } = getBiginConnection(context.auth);
      await biginApiService.createWebhook(
        accessToken,
        {
          watch: [
            {
              channel_id,
              events: [eventName],
              notify_url: context.webhookUrl,
              token,
              channel_expiry: nextExpiry(),
            },
          ],
        },
        apiDomain
      );
      const stored: StoredChannel = { channel_id, token };
      await context.store.put(storeKey, stored);
    },
    async onRenew(context: HookContext) {
      const stored = readStoredChannel(await context.store.get(storeKey));
      if (!stored) return;
      const { accessToken, apiDomain } = getBiginConnection(context.auth);
      await biginApiService.updateWebhook(
        accessToken,
        {
          watch: [
            {
              channel_id: stored.channel_id,
              events: [eventName],
              notify_url: context.webhookUrl,
              token: stored.token,
              channel_expiry: nextExpiry(),
            },
          ],
        },
        apiDomain
      );
    },
    async onDisable(context: HookContext) {
      const stored = readStoredChannel(await context.store.get(storeKey));
      if (!stored) return;
      const { accessToken, apiDomain } = getBiginConnection(context.auth);
      try {
        await biginApiService.deleteWebhook(accessToken, apiDomain, stored.channel_id);
      } catch (error) {
        if (!(error instanceof BiginApiError && error.status === 404)) throw error;
      }
      await context.store.delete(storeKey);
    },
    async run(context: RunContext) {
      const body = context.payload.body;
      if (!isObject(body)) return [];
      const stored = readStoredChannel(await context.store.get(storeKey));
      const expectedToken = stored?.token ?? ZOHO_WEBHOOK_TOKEN;
      if (body['token'] !== expectedToken) {
        throw new Error('Invalid webhook token');
      }
      const ids = Array.isArray(body['ids']) ? body['ids'].map((id) => String(id)) : [];
      const fetched = await fetchNotifiedRecords({ auth: context.auth, module, ids });
      const rest = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'token'));
      return [{ ...rest, ...fetched }];
    },
  };
}

type HookContext = {
  auth: { access_token: string; data: Record<string, unknown> };
  webhookUrl: string;
  store: {
    get: (key: string) => Promise<unknown>;
    put: (key: string, value: StoredChannel) => Promise<unknown>;
    delete: (key: string) => Promise<void>;
  };
};

type RunContext = HookContext & { payload: { body: unknown } };

type NotifiedRecords = {
  records: BiginRecord[];
  records_error?: string;
};

type StoredChannel = {
  channel_id: string;
  token: string;
};

export const biginWebhook = { hooks, sampleData };
