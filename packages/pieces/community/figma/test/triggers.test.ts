import { afterEach, describe, expect, it, vi } from 'vitest';
import { figmaWebhook } from '../src/lib/common/webhook';
import { fileDeletedTrigger, fileUpdatedTrigger, libraryPublishedTrigger, newCommentTrigger, newFileVersionTrigger } from '../src/lib/triggers/figma-triggers';
import { AUTH, invoke, memoryStore, mockRoutes, passcodeOf } from './helpers';

afterEach(() => vi.restoreAllMocks());

function hookContext({ props = {}, store = memoryStore(), body = {} }: { props?: Record<string, unknown>; store?: ReturnType<typeof memoryStore>; body?: unknown }) {
  return { auth: AUTH, propsValue: props, store, webhookUrl: 'https://hooks.example.com/abc', payload: { body, headers: {} } };
}

async function enableWith({ trigger, props }: { trigger: { onEnable: unknown }; props: Record<string, unknown> }) {
  const calls = mockRoutes([{ method: 'POST', path: '/v2/webhooks', body: { id: '555' } }]);
  const store = memoryStore();
  await invoke({ fn: trigger.onEnable, ctx: hookContext({ props, store }) });
  return { calls, store, passcode: passcodeOf(calls[0].body) };
}

const triggers = [
  { trigger: newCommentTrigger, event: 'FILE_COMMENT', key: 'team_id', extra: { comment_id: '1' } },
  { trigger: newFileVersionTrigger, event: 'FILE_VERSION_UPDATE', key: 'context_id', extra: { version_id: '9' } },
  { trigger: fileUpdatedTrigger, event: 'FILE_UPDATE', key: 'context_id', extra: { timestamp: 't1' } },
  { trigger: libraryPublishedTrigger, event: 'LIBRARY_PUBLISH', key: 'context_id', extra: { timestamp: 't1' } },
  { trigger: fileDeletedTrigger, event: 'FILE_DELETE', key: 'context_id', extra: {} },
];

describe.each(triggers)('$event trigger', ({ trigger, event, key, extra }) => {
  it('registers a v2 webhook with context, context_id and a redacted passcode', async () => {
    const { calls, store } = await enableWith({ trigger, props: { context: 'team', [key]: 'https://www.figma.com/files/team/1696042570921517313/Team' } });
    expect(calls[0].body).toMatchObject({ event_type: event, context: 'team', context_id: '1696042570921517313', endpoint: 'https://hooks.example.com/abc' });
    expect(calls[0].redact).toBe(true);
    expect(store.data['figma_webhook']).toMatchObject({ webhookId: '555' });
    expect(JSON.stringify(store.data)).not.toContain(passcodeOf(calls[0].body));
    expect(trigger.outputSchema).toBeDefined();
  });
  it('accepts a matching passcode once, drops replays, wrong passcodes, PINGs and other events', async () => {
    const { store, passcode } = await enableWith({ trigger, props: { context: 'file', [key]: 'https://www.figma.com/design/HMvFQs5gIn9vdRYGCwgF9O/x' } });
    const body = { event_type: event, webhook_id: '555', file_key: 'K', passcode, ...extra };
    const run = (b: unknown) => invoke({ fn: trigger.run, ctx: hookContext({ store, body: b }) });
    const first = await run(body);
    expect(first).toHaveLength(1);
    expect(first[0]).not.toHaveProperty('passcode');
    expect(first[0]).toHaveProperty('_dedupe_key');
    expect(await run(body)).toEqual([]);
    expect(await run({ ...body, passcode: 'wrong' })).toEqual([]);
    expect(await run({ ...body, event_type: 'PING' })).toEqual([]);
  });
});

describe('webhook helper', () => {
  it('file context uses the main file key', () => {
    expect(figmaWebhook.resolveContext({ context: 'file', contextId: 'https://www.figma.com/design/HMvFQs5gIn9vdRYGCwgF9O/x?node-id=3-2' })).toEqual({ context: 'file', contextId: 'HMvFQs5gIn9vdRYGCwgF9O' });
    expect(() => figmaWebhook.resolveContext({ context: 'project', contextId: 'abc' })).toThrow('Project ID');
    expect(figmaWebhook.resolveContext({ context: undefined, contextId: '123' })).toEqual({ context: 'team', contextId: '123' });
  });
  it('deletes the webhook when store.put fails', async () => {
    const calls = mockRoutes([{ method: 'POST', path: '/v2/webhooks', body: { id: '555' } }, { method: 'DELETE', path: '/v2/webhooks/555' }]);
    const store = { ...memoryStore(), put: async () => { throw new Error('store down'); } };
    await expect(figmaWebhook.enable({ auth: AUTH, eventType: 'FILE_COMMENT', context: 'team', contextId: '1', webhookUrl: 'https://h', store })).rejects.toThrow('store down');
    expect(calls.map((c) => c.method)).toEqual(['POST', 'DELETE']);
  });
  it('treats 404 on disable as done and forgets ids, including the legacy key', async () => {
    const calls = mockRoutes([{ method: 'DELETE', path: '/v2/webhooks/555', status: 404, body: { err: 'Not found' } }, { method: 'DELETE', path: '/v2/webhooks/old' }]);
    const store = memoryStore({ figma_webhook: { webhookId: '555', passcodeHash: 'x' }, figma_new_comment_trigger_data: { webhookId: 'old' } });
    await figmaWebhook.disable({ auth: AUTH, store });
    expect(calls).toHaveLength(2);
    expect(store.data).toEqual({});
  });
  it('keeps the ID when disable fails with another error', async () => {
    mockRoutes([{ method: 'DELETE', path: '/v2/webhooks/555', status: 500, body: {} }]);
    const store = memoryStore({ figma_webhook: { webhookId: '555', passcodeHash: 'x' } });
    await expect(figmaWebhook.disable({ auth: AUTH, store })).rejects.toThrow('(500)');
    expect(store.data['figma_webhook']).toBeDefined();
  });
  it('accepts legacy webhooks without a stored passcode and drops events with no stored state', async () => {
    const legacy = memoryStore({ figma_new_comment_trigger_data: { webhookId: 'old' } });
    expect(await figmaWebhook.receive({ body: { event_type: 'FILE_COMMENT', comment_id: '1', webhook_id: 'old' }, eventType: 'FILE_COMMENT', store: legacy })).toHaveLength(1);
    expect(await figmaWebhook.receive({ body: { event_type: 'FILE_COMMENT', comment_id: '1' }, eventType: 'FILE_COMMENT', store: memoryStore() })).toEqual([]);
  });
  it('allows the same event again after the replay window', async () => {
    const { store, passcode } = await enableWith({ trigger: newCommentTrigger, props: { context: 'team', team_id: '1' } });
    const body = { event_type: 'FILE_COMMENT', webhook_id: '555', comment_id: '1', passcode };
    expect(await figmaWebhook.receive({ body, eventType: 'FILE_COMMENT', store, now: 0 })).toHaveLength(1);
    expect(await figmaWebhook.receive({ body, eventType: 'FILE_COMMENT', store, now: 3 * 60 * 60 * 1000 + 60000 })).toEqual([]);
    expect(await figmaWebhook.receive({ body, eventType: 'FILE_COMMENT', store, now: figmaWebhook.DEDUPE_WINDOW_MS + 1 })).toHaveLength(1);
  });
});
