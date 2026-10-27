import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { arteemis } from '../src';
import { SAMPLE_EVENTS } from '../src/lib/common/events';
import { API_KEY, call, fail, makeContext, ok, SECRET, signedPayload, startFakeArteemis, WEBHOOK_URL } from './helpers';

const ENDPOINT_ID = 'e1d2c3b4-a5f6-4e7d-8c9b-0a1b2c3d4e5f';
const EXPECTED: Record<string, string> = {
  new_reply: 'message.received',
  contact_status_changed: 'contact.status_changed',
  enrollment_started: 'enrollment.started',
  enrollment_ended: 'enrollment.ended',
  message_sent: 'message.sent',
  invitation_accepted: 'invitation.accepted',
  task_created: 'task.created',
  deal_stage_changed: 'deal.stage_changed',
  job_finished: 'job.finished',
};

let api: Awaited<ReturnType<typeof startFakeArteemis>>;
const triggers = arteemis.triggers();

beforeAll(async () => {
  api = await startFakeArteemis();
});
afterAll(() => api.close());
afterEach(() => {
  api.reset();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function enabledContext() {
  const context = makeContext();
  context.store.data.set('arteemis_webhook', { endpointId: ENDPOINT_ID, secret: SECRET });
  return context;
}

describe('triggers', () => {
  it('cover the nine webhook events', () => {
    expect(Object.keys(triggers).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.entries(EXPECTED))('%s creates its own endpoint for %s when the flow is published', async (name, event) => {
    api.aim();
    api.routes['webhooks_list'] = () => ok({ endpoints: [] });
    api.routes['webhooks_manage'] = () => ok({ endpoint: { id: ENDPOINT_ID, url: WEBHOOK_URL, events: [event] }, secret: SECRET });
    const context = makeContext();
    await call(triggers[name].onEnable, context);
    expect(api.calls.map((c) => c.tool)).toEqual(['webhooks_list', 'webhooks_manage']);
    expect(api.calls[1].authorization).toBe(`Bearer ${API_KEY}`);
    expect(api.calls[1].body).toEqual({
      operation: 'create',
      url: WEBHOOK_URL,
      events: [event],
      description: `Activepieces: ${triggers[name].displayName}`,
    });
    expect(context.store.data.get('arteemis_webhook')).toEqual({ endpointId: ENDPOINT_ID, secret: SECRET });
  });

  it.each(Object.entries(EXPECTED))('%s returns a signed %s flattened, with its dedupe key', async (name, event) => {
    const sample = SAMPLE_EVENTS[event as keyof typeof SAMPLE_EVENTS];
    const context = enabledContext();
    const [row] = await call<Record<string, unknown>[]>(triggers[name].run, { ...context, payload: signedPayload(sample) });
    expect(row).toMatchObject({ event_id: sample.id, event_type: event, occurred_at: sample.occurred_at, [DEDUPE_KEY_PROPERTY]: sample.id });
    expect(Object.values(row).every((value) => value === null || typeof value !== 'object')).toBe(true);
    const { [DEDUPE_KEY_PROPERTY]: _key, ...rest } = row;
    expect(rest).toEqual(triggers[name].sampleData);
  });

  it('flattens the contact and campaign into columns', async () => {
    const [row] = await call<Record<string, unknown>[]>(triggers['new_reply'].run, {
      ...enabledContext(),
      payload: signedPayload(SAMPLE_EVENTS['message.received']),
    });
    expect(row).toMatchObject({
      message_channel: 'email',
      contact_email: 'claire.martin@example.com',
      contact_reply_kind: 'interested',
      contact_custom_fields_industry_segment: 'SaaS',
      campaign_name: 'Q4 Heads of Sales',
    });
  });

  it('keeps the campaign columns when an event has no campaign', () => {
    expect(triggers['deal_stage_changed'].sampleData).toMatchObject({ campaign_id: null, campaign_name: null, stage_name: 'Meeting booked' });
  });

  it('drops a delivery signed with another secret', async () => {
    const forged = signedPayload(SAMPLE_EVENTS['message.received'], { secret: `whsec_${Buffer.from('another').toString('base64')}` });
    expect(await call(triggers['new_reply'].run, { ...enabledContext(), payload: forged })).toEqual([]);
  });

  it('drops a body changed after signing', async () => {
    const payload = signedPayload(SAMPLE_EVENTS['message.received']);
    payload.rawBody = payload.rawBody.replace('Claire', 'Mallory');
    expect(await call(triggers['new_reply'].run, { ...enabledContext(), payload })).toEqual([]);
  });

  it('drops a delivery signed more than five minutes ago, and one without its raw body', async () => {
    const old = signedPayload(SAMPLE_EVENTS['message.received'], { at: Math.floor(Date.now() / 1000) - 600 });
    expect(await call(triggers['new_reply'].run, { ...enabledContext(), payload: old })).toEqual([]);
    const { rawBody: _raw, ...withoutRaw } = signedPayload(SAMPLE_EVENTS['message.received']);
    expect(await call(triggers['new_reply'].run, { ...enabledContext(), payload: withoutRaw })).toEqual([]);
  });

  it('drops a test ping and an event of another type', async () => {
    const ping = { id: 'ping:1', type: 'ping', occurred_at: '2026-10-27T09:13:00.000Z', workspace_id: 'org_1', data: {} };
    const context = enabledContext();
    expect(await call(triggers['new_reply'].run, { ...context, payload: signedPayload(ping) })).toEqual([]);
    expect(await call(triggers['new_reply'].run, { ...context, payload: signedPayload(SAMPLE_EVENTS['task.created']) })).toEqual([]);
  });

  it('drops an event already received (a retried delivery)', async () => {
    const context = enabledContext();
    const payload = signedPayload(SAMPLE_EVENTS['message.received']);
    expect(await call<unknown[]>(triggers['new_reply'].run, { ...context, payload })).toHaveLength(1);
    expect(await call(triggers['new_reply'].run, { ...context, payload: signedPayload(SAMPLE_EVENTS['message.received'], { id: 'msg_retry' }) })).toEqual([]);
  });

  it('removes a leftover endpoint on the same URL before creating its own', async () => {
    api.aim();
    api.routes['webhooks_list'] = () =>
      ok({ endpoints: [{ id: 'old-1', url: WEBHOOK_URL, events: ['message.received'] }, { id: 'other', url: 'https://hooks.zapier.com/x', events: [] }] });
    api.routes['webhooks_manage'] = (body) =>
      body['operation'] === 'delete' ? ok({ endpoint_id: body['endpoint_id'], deleted: true }) : ok({ endpoint: { id: ENDPOINT_ID, url: WEBHOOK_URL, events: [] }, secret: SECRET });
    await call(triggers['new_reply'].onEnable, makeContext());
    expect(api.calls.map((c) => [c.tool, c.body['operation'] ?? null, c.body['endpoint_id'] ?? null])).toEqual([
      ['webhooks_list', null, null],
      ['webhooks_manage', 'delete', 'old-1'],
      ['webhooks_manage', 'create', null],
    ]);
  });

  it('deletes its endpoint and forgets it when the flow is turned off', async () => {
    api.aim();
    api.routes['webhooks_manage'] = () => ok({ endpoint_id: ENDPOINT_ID, deleted: true });
    const context = enabledContext();
    context.store.data.set('arteemis_webhook_seen_event_ids', ['message:1']);
    await call(triggers['new_reply'].onDisable, context);
    expect(api.calls[0].body).toEqual({ operation: 'delete', endpoint_id: ENDPOINT_ID });
    expect(context.store.data.size).toBe(0);
  });

  it('treats an endpoint already deleted in Arteemis as removed, and fails on another refusal', async () => {
    api.aim();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    api.routes['webhooks_manage'] = () => fail(404, 'NOT_FOUND', 'Endpoint not found');
    await call(triggers['new_reply'].onDisable, enabledContext());
    api.routes['webhooks_manage'] = () => fail(403, 'FORBIDDEN', 'Needs the admin role.');
    await expect(call(triggers['new_reply'].onDisable, enabledContext())).rejects.toThrow('Needs the admin role.');
  });

  it('turns the endpoint limit into a readable error', async () => {
    api.aim();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    api.routes['webhooks_list'] = () => ok({ endpoints: [] });
    api.routes['webhooks_manage'] = () => fail(422, 'REFUSED', 'This workspace already has 50 webhook endpoints.');
    await expect(call(triggers['new_reply'].onEnable, makeContext())).rejects.toThrow('This workspace already has 50 webhook endpoints.');
  });
});
