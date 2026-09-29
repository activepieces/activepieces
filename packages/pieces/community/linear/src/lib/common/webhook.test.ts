/// <reference types="vitest/globals" />

import { vi } from 'vitest';

const createWebhook = vi.fn();
const deleteWebhook = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    createWebhook = createWebhook;
    deleteWebhook = deleteWebhook;
  },
  LinearDocument: {},
}));

import '../../index';
import { linearNewIssue } from '../triggers/new-issue';

function buildContext(store: { put: ReturnType<typeof vi.fn> }) {
  return {
    auth: { type: 'SECRET_TEXT', secret_text: 'lin_api_test' },
    webhookUrl: 'https://example.com/hook',
    propsValue: { team_id: 'team-1' },
    store: { ...store, get: vi.fn(), delete: vi.fn() },
  };
}

describe('trigger onEnable (F2)', () => {
  beforeEach(() => {
    createWebhook.mockReset();
    deleteWebhook.mockReset();
  });

  test('stores the webhook id when Linear creates the webhook', async () => {
    createWebhook.mockResolvedValue({ success: true, webhook: Promise.resolve({ id: 'wh-1' }) });
    const put = vi.fn().mockResolvedValue(undefined);
    await linearNewIssue.onEnable(buildContext({ put }));
    expect(put).toHaveBeenCalledWith('_new_issue_trigger', { webhookId: 'wh-1' });
    expect(createWebhook.mock.calls[0][0]).toMatchObject({ teamId: 'team-1', resourceTypes: ['Issue'] });
  });

  test('throws a clear admin-key message when Linear refuses', async () => {
    createWebhook.mockRejectedValue(Object.assign(new Error('Forbidden'), { type: 'Forbidden' }));
    await expect(linearNewIssue.onEnable(buildContext({ put: vi.fn() }))).rejects.toThrow('workspace admin');
  });

  test('throws instead of silently continuing when success is false', async () => {
    createWebhook.mockResolvedValue({ success: false, webhook: Promise.resolve(undefined) });
    const put = vi.fn();
    await expect(linearNewIssue.onEnable(buildContext({ put }))).rejects.toThrow('refused to create the webhook');
    expect(put).not.toHaveBeenCalled();
  });

  test('deletes the created webhook when storing its id fails', async () => {
    createWebhook.mockResolvedValue({ success: true, webhook: Promise.resolve({ id: 'wh-2' }) });
    deleteWebhook.mockResolvedValue({ success: true });
    const put = vi.fn().mockRejectedValue(new Error('store down'));
    await expect(linearNewIssue.onEnable(buildContext({ put }))).rejects.toThrow('store down');
    expect(deleteWebhook).toHaveBeenCalledWith('wh-2');
  });
});

describe('trigger onDisable', () => {
  beforeEach(() => {
    deleteWebhook.mockReset();
  });

  function disableContext() {
    const values = new Map<string, unknown>([['_new_issue_trigger', { webhookId: 'wh-9' }]]);
    return {
      values,
      context: {
        auth: { type: 'SECRET_TEXT', secret_text: 'lin_api_test' },
        webhookUrl: 'https://example.com/hook',
        propsValue: {},
        store: {
          put: vi.fn(),
          get: vi.fn(async (key: string) => values.get(key)),
          delete: vi.fn(async (key: string) => {
            values.delete(key);
          }),
        },
      },
    };
  }

  test('treats a webhook Linear already deleted as gone and clears the store', async () => {
    deleteWebhook.mockRejectedValue(new Error('Entity not found: Webhook - Could not find referenced Webhook.'));
    const { values, context } = disableContext();
    await linearNewIssue.onDisable(context);
    expect(deleteWebhook).toHaveBeenCalledWith('wh-9');
    expect(values.has('_new_issue_trigger')).toBe(false);
  });

  test('rethrows any other error and keeps the stored webhook', async () => {
    deleteWebhook.mockRejectedValue(new Error('Linear rate limit reached.'));
    const { values, context } = disableContext();
    await expect(linearNewIssue.onDisable(context)).rejects.toThrow('rate limit');
    expect(values.get('_new_issue_trigger')).toEqual({ webhookId: 'wh-9' });
  });
});
