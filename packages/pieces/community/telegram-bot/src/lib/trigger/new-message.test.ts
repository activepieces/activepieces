/// <reference types="vitest/globals" />

import { vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest } };
});

import '../../index';
import { telegramNewMessage } from './new-message';

const auth = { type: 'SECRET_TEXT', secret_text: 'bot-token' };
const update = { update_id: 1, message: { text: 'hi' } };

function createStore() {
  const values = new Map<string, unknown>();
  return {
    values,
    store: {
      put: async <T>(key: string, value: T) => {
        values.set(key, value);
        return value;
      },
      get: async (key: string) => values.get(key) ?? null,
      delete: async (key: string) => {
        values.delete(key);
      },
    },
  };
}

function hookContext({ store, headers }: { store: ReturnType<typeof createStore>['store']; headers: Record<string, string> }) {
  return {
    ...createMockActionContext({ propsValue: { update_types: ['message'] } }),
    auth,
    store,
    webhookUrl: 'https://example.com/webhook',
    payload: { body: update, headers, queryParams: {} },
  };
}

function storedSecret(values: Map<string, unknown>): string {
  const secret = [...values.values()][0];
  if (typeof secret !== 'string') {
    throw new Error('no secret stored');
  }
  return secret;
}

describe('telegram new_telegram_message webhook secret', () => {
  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({ status: 200, body: { ok: true } });
  });

  test('registers the webhook with the stored secret token', async () => {
    const { store, values } = createStore();
    await telegramNewMessage.onEnable(hookContext({ store, headers: {} }));
    const secret = storedSecret(values);
    expect(secret).toMatch(/^[a-f0-9]{64}$/);
    expect(sendRequest.mock.calls[0][0].body).toMatchObject({ secret_token: secret, allowed_updates: ['message'] });
  });

  test('accepts an update carrying the secret token', async () => {
    const { store, values } = createStore();
    await telegramNewMessage.onEnable(hookContext({ store, headers: {} }));
    const headers = { 'x-telegram-bot-api-secret-token': storedSecret(values) };
    expect(await telegramNewMessage.run(hookContext({ store, headers }))).toEqual([update]);
  });

  test('drops an update with a wrong or missing secret token', async () => {
    const { store } = createStore();
    await telegramNewMessage.onEnable(hookContext({ store, headers: {} }));
    expect(await telegramNewMessage.run(hookContext({ store, headers: { 'x-telegram-bot-api-secret-token': 'wrong' } }))).toEqual([]);
    expect(await telegramNewMessage.run(hookContext({ store, headers: {} }))).toEqual([]);
  });

  test('keeps accepting updates for flows enabled before the secret existed', async () => {
    const { store } = createStore();
    expect(await telegramNewMessage.run(hookContext({ store, headers: {} }))).toEqual([update]);
  });

  test('forgets the secret when the flow is disabled', async () => {
    const { store, values } = createStore();
    await telegramNewMessage.onEnable(hookContext({ store, headers: {} }));
    await telegramNewMessage.onDisable(hookContext({ store, headers: {} }));
    expect(values.size).toBe(0);
  });
});
