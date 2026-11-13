/// <reference types="vitest/globals" />

import crypto from 'crypto';
import { vi } from 'vitest';

const rawRequest = vi.fn();
const deleteWebhook = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    client = { rawRequest };
    deleteWebhook = deleteWebhook;
  },
  LinearDocument: {},
}));

import '../../index';
import { linearNewProjectStatusUpdate } from './new-project-status-update';

const SECRET = 'a'.repeat(64);
const HOUR = 60 * 60 * 1000;
const BODY = bodyAt(Date.now());

function bodyAt(webhookTimestamp: number | undefined): string {
  return JSON.stringify({ action: 'create', type: 'ProjectUpdate', data: { id: 'pu-1', projectId: 'p-1' }, webhookTimestamp });
}

function sign({ body, secret = SECRET }: { body: string; secret?: string }): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function memoryStore(initial: Record<string, unknown>) {
  const values = new Map<string, unknown>(Object.entries(initial));
  return {
    values,
    get: vi.fn(async (key: string) => values.get(key) ?? null),
    put: vi.fn(async (key: string, value: unknown) => {
      values.set(key, value);
      return value;
    }),
    delete: vi.fn(async (key: string) => {
      values.delete(key);
    }),
  };
}

function runContext({
  headers,
  rawBody = BODY,
  stored = { webhookId: 'wh-1', secret: SECRET },
  store = memoryStore({ _new_project_status_update_trigger: stored }),
}: RunContextParams) {
  return {
    auth: { type: 'SECRET_TEXT', secret_text: 'lin_api_test' },
    propsValue: { project_id: undefined },
    store,
    payload: { body: JSON.parse(rawBody), headers, rawBody },
  };
}

describe('new_project_status_update signature', () => {
  test('onEnable sends a random secret to Linear and stores it with the webhook id', async () => {
    rawRequest.mockResolvedValue({ data: { webhookCreate: { success: true, webhook: { id: 'wh-1' } } } });
    const put = vi.fn().mockResolvedValue(undefined);
    await linearNewProjectStatusUpdate.onEnable({
      auth: { type: 'SECRET_TEXT', secret_text: 'lin_api_test' },
      webhookUrl: 'https://example.com/hook',
      propsValue: {},
      store: { put, get: vi.fn(), delete: vi.fn() },
    });
    const secret = rawRequest.mock.calls[0][1].input.secret;
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(put).toHaveBeenCalledWith('_new_project_status_update_trigger', { webhookId: 'wh-1', secret });
  });

  test('accepts a delivery signed with the stored secret', async () => {
    const out = await linearNewProjectStatusUpdate.run(runContext({ headers: { 'Linear-Signature': sign({ body: BODY }) } }));
    expect(out).toHaveLength(1);
  });

  test('drops unsigned, wrongly signed and tampered deliveries', async () => {
    expect(await linearNewProjectStatusUpdate.run(runContext({ headers: {} }))).toEqual([]);
    expect(
      await linearNewProjectStatusUpdate.run(runContext({ headers: { 'linear-signature': sign({ body: BODY, secret: 'b'.repeat(64) }) } })),
    ).toEqual([]);
    expect(
      await linearNewProjectStatusUpdate.run(
        runContext({ headers: { 'linear-signature': sign({ body: BODY }) }, rawBody: BODY.replace('pu-1', 'pu-2') }),
      ),
    ).toEqual([]);
    expect(await linearNewProjectStatusUpdate.run(runContext({ headers: { 'linear-signature': 'zz' } }))).toEqual([]);
  });

  test('drops deliveries when no secret was stored', async () => {
    const out = await linearNewProjectStatusUpdate.run(
      runContext({ headers: { 'linear-signature': sign({ body: BODY }) }, stored: { webhookId: 'wh-1', secret: undefined } }),
    );
    expect(out).toEqual([]);
  });
});

describe('new_project_status_update replay protection', () => {
  test('drops a signed delivery whose webhookTimestamp is more than 7 hours old or ahead, or missing', async () => {
    for (const timestamp of [Date.now() - 7 * HOUR - 60 * 1000, Date.now() + 7 * HOUR + 60 * 1000, undefined]) {
      const body = bodyAt(timestamp);
      const out = await linearNewProjectStatusUpdate.run(runContext({ headers: { 'linear-signature': sign({ body }) }, rawBody: body }));
      expect(out).toEqual([]);
    }
  });

  test.each([
    { retry: 'first retry after about a minute', age: 60 * 1000 },
    { retry: 'second retry after about an hour', age: HOUR },
    { retry: 'last retry after about six hours', age: 6 * HOUR + 10 * 60 * 1000 },
  ])('accepts a signed delivery on the $retry', async ({ age }) => {
    const body = bodyAt(Date.now() - age);
    const out = await linearNewProjectStatusUpdate.run(runContext({ headers: { 'linear-signature': sign({ body }) }, rawBody: body }));
    expect(out).toHaveLength(1);
  });

  test('returns a repeated Linear-Delivery id only once', async () => {
    const store = memoryStore({ _new_project_status_update_trigger: { webhookId: 'wh-1', secret: SECRET } });
    const headers = { 'Linear-Signature': sign({ body: BODY }), 'Linear-Delivery': 'delivery-1' };
    expect(await linearNewProjectStatusUpdate.run(runContext({ headers, store }))).toHaveLength(1);
    expect(await linearNewProjectStatusUpdate.run(runContext({ headers: { 'linear-signature': sign({ body: BODY }), 'linear-delivery': 'delivery-1' }, store }))).toEqual([]);
    expect(
      await linearNewProjectStatusUpdate.run(runContext({ headers: { ...headers, 'Linear-Delivery': 'delivery-2' }, store })),
    ).toHaveLength(1);
    expect(store.values.get('_new_project_status_update_deliveries')).toEqual(['delivery-1', 'delivery-2']);
  });

  test('keeps only the last 200 delivery ids', async () => {
    const earlier = Array.from({ length: 200 }, (_, index) => `old-${index}`);
    const store = memoryStore({
      _new_project_status_update_trigger: { webhookId: 'wh-1', secret: SECRET },
      _new_project_status_update_deliveries: earlier,
    });
    const headers = { 'linear-signature': sign({ body: BODY }), 'linear-delivery': 'new-1' };
    expect(await linearNewProjectStatusUpdate.run(runContext({ headers, store }))).toHaveLength(1);
    const kept = store.values.get('_new_project_status_update_deliveries');
    expect(kept).toHaveLength(200);
    expect(kept).toEqual([...earlier.slice(1), 'new-1']);
  });
});

describe('new_project_status_update onDisable', () => {
  beforeEach(() => {
    deleteWebhook.mockReset();
  });

  test('deletes the webhook and clears the store', async () => {
    deleteWebhook.mockResolvedValue({ success: true });
    const store = memoryStore({ _new_project_status_update_trigger: { webhookId: 'wh-1', secret: SECRET } });
    await linearNewProjectStatusUpdate.onDisable(disableContext(store));
    expect(deleteWebhook).toHaveBeenCalledWith('wh-1');
    expect(store.delete).toHaveBeenCalledWith('_new_project_status_update_trigger');
  });

  test('treats a webhook Linear no longer has as already deleted', async () => {
    deleteWebhook.mockRejectedValue(new Error('Entity not found: Webhook - Could not find referenced Webhook.'));
    const store = memoryStore({ _new_project_status_update_trigger: { webhookId: 'wh-1', secret: SECRET } });
    await linearNewProjectStatusUpdate.onDisable(disableContext(store));
    expect(store.delete).toHaveBeenCalledWith('_new_project_status_update_trigger');
    expect(store.values.has('_new_project_status_update_trigger')).toBe(false);
  });

  test('keeps the stored webhook when Linear fails for another reason', async () => {
    deleteWebhook.mockRejectedValue(new Error('Linear rate limit reached.'));
    const store = memoryStore({ _new_project_status_update_trigger: { webhookId: 'wh-1', secret: SECRET } });
    await expect(linearNewProjectStatusUpdate.onDisable(disableContext(store))).rejects.toThrow('rate limit');
    expect(store.values.has('_new_project_status_update_trigger')).toBe(true);
  });
});

function disableContext(store: ReturnType<typeof memoryStore>) {
  return {
    auth: { type: 'SECRET_TEXT', secret_text: 'lin_api_test' },
    webhookUrl: 'https://example.com/hook',
    propsValue: {},
    store,
  };
}

type RunContextParams = {
  headers: Record<string, string>;
  rawBody?: string;
  stored?: { webhookId: string; secret: string | undefined };
  store?: ReturnType<typeof memoryStore>;
};
