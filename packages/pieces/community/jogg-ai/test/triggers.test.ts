import { createHmac } from 'crypto';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { joggAi } from '../src/index';
import { videoGeneratedSuccessfully } from '../src/lib/triggers/video-generation-events';
import { videoGenerationFailed } from '../src/lib/triggers/video-generation-failed';

function makeStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function call({ fn, target, context }: { fn: unknown; target: unknown; context: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') throw new Error('not a function');
  return Promise.resolve(Reflect.apply(fn, target, [context]));
}

function runCtx({
  store,
  body,
  headers = {},
  rawBody,
}: {
  store: ReturnType<typeof makeStore>;
  body: unknown;
  headers?: Record<string, string>;
  rawBody?: string;
}) {
  return { auth: { secret_text: 'k' }, propsValue: {}, store, payload: { body, headers, rawBody } };
}

function sign({ secret, raw }: { secret: string; raw: string }): string {
  return createHmac('sha256', secret).update(raw).digest('hex');
}

function event({ id, name, data = { video_id: 'v1' } }: { id?: string; name: string; data?: unknown }) {
  return { event_id: id, event: name, timestamp: 1732806631, data };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('video generated successfully trigger', () => {
  it('is registered on the piece', () => {
    expect(Object.keys(joggAi.triggers())).toContain('videoGeneratedSuccessfully');
  });

  const trigger = videoGeneratedSuccessfully;

  it('stores data.endpoint_id from the v2 response on enable', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { code: 0, msg: 'Success', data: { endpoint_id: 'wh_1', secret: 'whsec' } },
    });
    const store = makeStore();
    await call({ fn: trigger.onEnable, target: trigger, context: { ...runCtx({ store, body: {} }), webhookUrl: 'https://h/w' } });
    expect(store.data.get('_video_generation_success_webhook')).toEqual({ endpoint_id: 'wh_1', secret: 'whsec' });
    const sent = spy.mock.calls[0][0];
    expect(sent.url).toBe('https://api.jogg.ai/v2/endpoint');
    expect(sent.method).toBe(HttpMethod.POST);
    expect(JSON.stringify(sent.body)).toContain('generated_avatar_video_success');
  });

  it('deletes the new endpoint when saving it fails, and explains a missing endpoint_id', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { code: 0, msg: 'Success', data: { endpoint_id: 'wh_2', secret: 's' } },
    });
    const store = makeStore();
    const failing = { ...store, put: async () => { throw new Error('store down'); } };
    await expect(
      call({ fn: trigger.onEnable, target: trigger, context: { ...runCtx({ store, body: {} }), store: failing, webhookUrl: 'https://h/w' } })
    ).rejects.toThrow('store down');
    expect(spy.mock.calls[1][0]).toMatchObject({ method: HttpMethod.DELETE, url: 'https://api.jogg.ai/v2/endpoint/wh_2' });
    spy.mockResolvedValue({ status: 200, headers: {}, body: { code: 0, msg: 'Success', data: {} } });
    await expect(
      call({ fn: trigger.onEnable, target: trigger, context: { ...runCtx({ store, body: {} }), webhookUrl: 'https://h/w' } })
    ).rejects.toThrow('did not include an endpoint_id');
  });

  it('deletes the stored endpoint on disable', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { code: 0, msg: 'Success', data: {} },
    });
    const store = makeStore();
    store.data.set('_video_generation_success_webhook', { endpoint_id: 'wh_1' });
    await call({ fn: trigger.onDisable, target: trigger, context: runCtx({ store, body: {} }) });
    expect(spy.mock.calls[0][0].url).toBe('https://api.jogg.ai/v2/endpoint/wh_1');
    expect(spy.mock.calls[0][0].method).toBe(HttpMethod.DELETE);
    expect(store.data.has('_video_generation_success_webhook')).toBe(false);
  });

  it('accepts video_id payloads for each success event and ignores failures', async () => {
    const store = makeStore();
    for (const name of ['generated_video_success', 'generated_avatar_video_success', 'generated_template_video_success']) {
      const out = await call({
        fn: trigger.run,
        target: trigger,
        context: runCtx({ store, body: event({ id: name, name, data: { video_id: name } }) }),
      });
      expect(out).toHaveLength(1);
    }
    const failed = await call({
      fn: trigger.run,
      target: trigger,
      context: runCtx({ store, body: event({ id: 'x', name: 'generated_avatar_video_failed' }) }),
    });
    expect(failed).toEqual([]);
  });

  it('drops duplicate deliveries of the same event_id', async () => {
    const store = makeStore();
    const body = event({ id: 'evt_1', name: 'generated_avatar_video_success' });
    expect(await call({ fn: trigger.run, target: trigger, context: runCtx({ store, body }) })).toHaveLength(1);
    expect(await call({ fn: trigger.run, target: trigger, context: runCtx({ store, body }) })).toEqual([]);
  });

  it('fires once per video and outcome even when generic and per-type events both arrive', async () => {
    const store = makeStore();
    const first = await call({ fn: trigger.run, target: trigger, context: runCtx({ store, body: event({ id: 'e1', name: 'generated_video_success' }) }) });
    const second = await call({ fn: trigger.run, target: trigger, context: runCtx({ store, body: event({ id: 'e2', name: 'generated_avatar_video_success' }) }) });
    expect(first).toHaveLength(1);
    expect(second).toEqual([]);
  });

  it('verifies X-Webhook-Signature against the raw body when a secret is stored', async () => {
    const store = makeStore();
    store.data.set('_video_generation_success_webhook', { endpoint_id: 'wh_1', secret: 'whsec' });
    const body = event({ id: 'e9', name: 'generated_avatar_video_success', data: { video_id: 'v9' } });
    const raw = JSON.stringify(body);
    const bad = await call({
      fn: trigger.run,
      target: trigger,
      context: runCtx({ store, body, rawBody: raw, headers: { 'x-webhook-signature': sign({ secret: 'other', raw }) } }),
    });
    const missing = await call({ fn: trigger.run, target: trigger, context: runCtx({ store, body, rawBody: raw }) });
    const good = await call({
      fn: trigger.run,
      target: trigger,
      context: runCtx({ store, body, rawBody: raw, headers: { 'X-Webhook-Signature': sign({ secret: 'whsec', raw }) } }),
    });
    expect(bad).toEqual([]);
    expect(missing).toEqual([]);
    expect(good).toHaveLength(1);
  });

  it('ignores payloads without a video or project id', async () => {
    const store = makeStore();
    const out = await call({
      fn: trigger.run,
      target: trigger,
      context: runCtx({ store, body: event({ id: 'e', name: 'generated_video_success', data: {} }) }),
    });
    expect(out).toEqual([]);
  });
});

describe('video generation failed trigger', () => {
  it('accepts failed events only', async () => {
    const store = makeStore();
    const trigger = videoGenerationFailed;
    const ok = await call({
      fn: trigger.run,
      target: trigger,
      context: runCtx({ store, body: event({ id: 'a', name: 'generated_template_video_failed' }) }),
    });
    const skipped = await call({
      fn: trigger.run,
      target: trigger,
      context: runCtx({ store, body: event({ id: 'b', name: 'generated_avatar_video_success' }) }),
    });
    expect(ok).toHaveLength(1);
    expect(skipped).toEqual([]);
  });
});
