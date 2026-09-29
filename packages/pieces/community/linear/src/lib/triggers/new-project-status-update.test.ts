/// <reference types="vitest/globals" />

import crypto from 'crypto';
import { vi } from 'vitest';

const createWebhook = vi.fn();

vi.mock('@linear/sdk', () => ({
  LinearClient: class {
    createWebhook = createWebhook;
  },
  LinearDocument: {},
}));

import '../../index';
import { linearNewProjectStatusUpdate } from './new-project-status-update';

const SECRET = 'a'.repeat(64);
const BODY = JSON.stringify({ action: 'create', type: 'ProjectUpdate', data: { id: 'pu-1', projectId: 'p-1' } });

function sign({ body, secret = SECRET }: { body: string; secret?: string }): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function runContext({ headers, rawBody = BODY, stored = { webhookId: 'wh-1', secret: SECRET } }: RunContextParams) {
  return {
    auth: { type: 'SECRET_TEXT', secret_text: 'lin_api_test' },
    propsValue: { project_id: undefined },
    store: { get: vi.fn().mockResolvedValue(stored), put: vi.fn(), delete: vi.fn() },
    payload: { body: JSON.parse(BODY), headers, rawBody },
  };
}

describe('new_project_status_update signature', () => {
  test('onEnable sends a random secret to Linear and stores it with the webhook id', async () => {
    createWebhook.mockResolvedValue({ success: true, webhook: Promise.resolve({ id: 'wh-1' }) });
    const put = vi.fn().mockResolvedValue(undefined);
    await linearNewProjectStatusUpdate.onEnable({
      auth: { type: 'SECRET_TEXT', secret_text: 'lin_api_test' },
      webhookUrl: 'https://example.com/hook',
      propsValue: {},
      store: { put, get: vi.fn(), delete: vi.fn() },
    });
    const secret = createWebhook.mock.calls[0][0].secret;
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

type RunContextParams = {
  headers: Record<string, string>;
  rawBody?: string;
  stored?: { webhookId: string; secret: string | undefined };
};
