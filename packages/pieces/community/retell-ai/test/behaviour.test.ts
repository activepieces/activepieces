import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { createHmac } from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { createBatchCallAction } from '../src/lib/actions/create-batch-call';
import { createPhoneNumber } from '../src/lib/actions/create-phone-number';
import { getCall } from '../src/lib/actions/get-call';
import { makePhoneCall } from '../src/lib/actions/make-phone-call';
import { createPhoneCallAction } from '../src/lib/actions/ai/create-phone-call';
import { deleteCallAction } from '../src/lib/actions/ai/delete-call';
import { getCallByIdAction } from '../src/lib/actions/ai/get-call-by-id';
import { getContactByPhoneAction } from '../src/lib/actions/ai/get-contact-by-phone';
import { listCallsAction } from '../src/lib/actions/ai/list-calls';
import { stopCallAction } from '../src/lib/actions/ai/stop-call';
import { updateAgentAction } from '../src/lib/actions/ai/update-agent';
import { updateCallMetadataAction } from '../src/lib/actions/ai/update-call-metadata';
import { retellAiAuth } from '../src/lib/common/auth';
import { buildRetellUrl, RetellAiError, retellApiCall } from '../src/lib/common/client';
import { retellInput } from '../src/lib/common/input';
import { agentIdDropdown, callIdDropdown } from '../src/lib/common/props';
import { verifyRetellSignature } from '../src/lib/common/webhook';
import { callAnalyzedTrigger } from '../src/lib/triggers/call-analyzed';
import { callEndedTrigger } from '../src/lib/triggers/call-ended';
import { newCallTrigger } from '../src/lib/triggers/new-call';
import { CALL } from './fixtures';
import { API_KEY, invoke, makeContext, makeStore, stubFetch, toDropdown } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

type Runnable = { run: (...args: never[]) => Promise<unknown> };

function runAction({ action, props }: { action: Runnable; props: Record<string, unknown> }) {
  return invoke({ fn: action.run, self: action, args: [makeContext({ props })] });
}

describe('path safety', () => {
  it.each(['..', '.', 'a/b', '../delete-call/x', '', '   '])('seg rejects %j', (value) => {
    expect(() => retellInput.seg({ value, label: 'Call ID' })).toThrow();
  });

  it('seg encodes reserved characters', () => {
    expect(retellInput.seg({ value: 'call?x=1#y', label: 'Call ID' })).toBe('call%3Fx%3D1%23y');
  });

  it('buildRetellUrl refuses traversal, protocol-relative and query paths', () => {
    expect(() => buildRetellUrl({ path: '/v2/get-call/../delete-call/x' })).toThrow();
    expect(() => buildRetellUrl({ path: '//evil.example/x' })).toThrow();
    expect(() => buildRetellUrl({ path: '/get-call?x=1' })).toThrow();
    expect(buildRetellUrl({ path: '/get-agent/a', query: { version: 2, empty: '', none: undefined } })).toBe(
      'https://api.retellai.com/get-agent/a?version=2',
    );
  });

  it('get_call never sends an AI-filled traversal id to another endpoint', async () => {
    const calls = stubFetch([]);
    await expect(runAction({ action: getCall, props: { callId: '../delete-call/x' } })).rejects.toThrow('not a valid Retell AI ID');
    await expect(runAction({ action: getCallByIdAction, props: { call_id: '..' } })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

describe('error mapping', () => {
  it('uses Retell error_message and keeps the body in responseBody, never body', async () => {
    stubFetch([{ status: 400, body: { error_message: 'from_number is not owned' } }]);
    const error = await runAction({
      action: createPhoneCallAction,
      props: { from_number: '+14155550100', to_number: '+14155550101' },
    }).catch((e: unknown) => e);
    if (!(error instanceof RetellAiError)) {
      throw new Error('expected a RetellAiError');
    }
    const retellError = error;
    expect(retellError.message).toBe('Retell AI rejected the request as invalid (HTTP 400): from_number is not owned');
    expect(retellError.status).toBe(400);
    expect(retellError.responseBody).toEqual({ error_message: 'from_number is not owned' });
    expect(Object.keys(retellError)).not.toContain('body');
  });

  it('does not log request bodies (redactBodyInErrors)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch([{ status: 500, body: { error_message: 'boom' } }]);
    await expect(
      runAction({ action: updateCallMetadataAction, props: { call_id: 'c', metadata: { secret_note: 'do-not-log' } } }),
    ).rejects.toThrow('server error');
    for (const args of consoleError.mock.calls) {
      expect(JSON.stringify(args)).not.toContain('do-not-log');
    }
  });

  it('retries 429 on reads with backoff, then succeeds', async () => {
    vi.useFakeTimers();
    const calls = stubFetch([{ status: 429, body: {} }, { status: 429, body: {} }, { status: 200, body: CALL }]);
    const promise = runAction({ action: getCallByIdAction, props: { call_id: 'call_1' } });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toMatchObject({ call_id: 'call_1' });
    expect(calls).toHaveLength(3);
  });

  it('gives up after two 429 retries', async () => {
    vi.useFakeTimers();
    const calls = stubFetch([{ status: 429 }, { status: 429 }, { status: 429 }]);
    const promise = runAction({ action: getCallByIdAction, props: { call_id: 'call_1' } }).catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    expect(await promise).toBeInstanceOf(RetellAiError);
    expect(calls).toHaveLength(3);
  });

  it('never retries a call that dials a phone', async () => {
    const calls = stubFetch([{ status: 429, body: { error_message: 'concurrency' } }]);
    await expect(
      runAction({ action: createPhoneCallAction, props: { from_number: '+14155550100', to_number: '+14155550101' } }),
    ).rejects.toThrow('rate or concurrency limit');
    expect(calls).toHaveLength(1);
  });

  it('does not follow redirects', async () => {
    stubFetch([{ status: 302 }]);
    await expect(retellApiCall({ apiKey: API_KEY, method: HttpMethod.GET, path: '/get-concurrency' })).rejects.toThrow(
      'unexpected redirect',
    );
  });
});

describe('auth.validate', () => {
  const validate = (apiKey: string) =>
    invoke({ fn: retellAiAuth.validate, self: retellAiAuth, args: [{ auth: { apiKey }, server: { apiUrl: '', publicUrl: '' } }] });

  it('probes POST /v2/list-agents?limit=1 with the trimmed key', async () => {
    const calls = stubFetch([{ status: 200, body: { items: [], has_more: false } }]);
    await expect(validate(` ${API_KEY} `)).resolves.toEqual({ valid: true });
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url.pathname).toBe('/v2/list-agents');
    expect(calls[0].url.searchParams.get('limit')).toBe('1');
    expect(calls[0].headers['authorization']).toBe(`Bearer ${API_KEY}`);
  });

  it('reports invalid key only on 401/403', async () => {
    stubFetch([{ status: 401, body: { error_message: 'bad key' } }]);
    await expect(validate('x')).resolves.toEqual({ valid: false, error: 'Invalid API Key: Retell AI rejected it.' });
  });

  it('reports other failures as a verification problem, not a bad key', async () => {
    stubFetch([{ status: 503, body: {} }]);
    const result = await validate('x');
    expect(result).toMatchObject({ valid: false });
    expect(JSON.stringify(result)).toContain('Could not verify');
  });
});

describe('input validation', () => {
  it('rejects non-E.164 numbers before any request', async () => {
    const calls = stubFetch([]);
    await expect(runAction({ action: makePhoneCall, props: { fromNumber: '4155550100', toNumber: '+14155550101' } })).rejects.toThrow(
      'E.164',
    );
    expect(calls).toHaveLength(0);
  });

  it('create_phone_number refuses area code and phone number together', async () => {
    const calls = stubFetch([]);
    await expect(
      runAction({ action: createPhoneNumber, props: { nickname: 'x', areaCode: 415, phoneNumber: '+14155550100' } }),
    ).rejects.toThrow('either Area Code or Phone Number');
    expect(calls).toHaveLength(0);
  });

  it('dynamic variables must be an object and non-string values become text', () => {
    expect(retellInput.stringMap({ value: { a: 1, b: false, c: { d: 1 }, e: null }, label: 'X' })).toEqual({
      a: '1',
      b: 'false',
      c: '{"d":1}',
    });
    expect(() => retellInput.stringMap({ value: '[1]', label: 'Dynamic Variables' })).toThrow('JSON object');
  });

  it('batch call validates every number and the size cap', async () => {
    const calls = stubFetch([]);
    await expect(
      runAction({ action: createBatchCallAction, props: { from_number: '+14155550100', tasks: [{ to_number: '+1415' }, { to_number: 'abc' }] } }),
    ).rejects.toThrow('Call 2 To Number must be in E.164');
    await expect(runAction({ action: createBatchCallAction, props: { from_number: '+14155550100', tasks: [] } })).rejects.toThrow(
      'at least one call',
    );
    const many = Array.from({ length: 1001 }, () => ({ to_number: '+14155550101' }));
    await expect(runAction({ action: createBatchCallAction, props: { from_number: '+14155550100', tasks: many } })).rejects.toThrow(
      'at most 1000',
    );
    expect(calls).toHaveLength(0);
  });

  it('list_calls validates statuses and time range', async () => {
    const calls = stubFetch([]);
    await expect(runAction({ action: listCallsAction, props: { call_status: 'done' } })).rejects.toThrow('unknown values: done');
    await expect(
      runAction({ action: listCallsAction, props: { started_after: '2026-02-01T00:00:00Z', started_before: '2026-01-01T00:00:00Z' } }),
    ).rejects.toThrow('earlier than');
    await expect(runAction({ action: listCallsAction, props: { limit: 5000 } })).rejects.toThrow('between 1 and 1000');
    expect(calls).toHaveLength(0);
  });

  it('update actions refuse an empty update and contradictory clear flags', async () => {
    const calls = stubFetch([]);
    await expect(runAction({ action: updateAgentAction, props: { agent_id: 'a' } })).rejects.toThrow('at least one field');
    await expect(
      runAction({ action: updateAgentAction, props: { agent_id: 'a', webhook_url: 'https://x.example', clear_webhook_url: true } }),
    ).rejects.toThrow('not both');
    await expect(runAction({ action: updateCallMetadataAction, props: { call_id: 'c' } })).rejects.toThrow('Set Metadata');
    expect(calls).toHaveLength(0);
  });
});

describe('documented empty and not-found results', () => {
  it('stop_call reports a call that is no longer ongoing', async () => {
    stubFetch([{ status: 404, body: { error_message: 'not found' } }]);
    await expect(runAction({ action: stopCallAction, props: { call_id: 'call_1' } })).resolves.toEqual({
      call_id: 'call_1',
      stopped: false,
      reason: 'Call not found or no longer ongoing (HTTP 404).',
    });
  });

  it('stop_call reports a call that has not started (HTTP 400) as not stopped, and rethrows other 400s', async () => {
    stubFetch([{ status: 400, body: { message: 'Can only stop an ongoing call.' } }, { status: 400, body: { message: 'bad' } }]);
    await expect(runAction({ action: stopCallAction, props: { call_id: 'call_1' } })).resolves.toEqual({
      call_id: 'call_1',
      stopped: false,
      reason: 'Call is not ongoing (not started yet or already over).',
    });
    await expect(runAction({ action: stopCallAction, props: { call_id: 'call_1' } })).rejects.toThrow('HTTP 400');
  });

  it('delete_call treats 404 as already deleted but rethrows other errors', async () => {
    stubFetch([{ status: 404 }, { status: 500 }]);
    await expect(runAction({ action: deleteCallAction, props: { call_id: 'call_1' } })).resolves.toEqual({
      call_id: 'call_1',
      deleted: false,
      already_deleted: true,
    });
    await expect(runAction({ action: deleteCallAction, props: { call_id: 'call_1' } })).rejects.toThrow('server error');
  });

  it('get_contact_by_phone returns found=false on 404', async () => {
    stubFetch([{ status: 404 }]);
    await expect(runAction({ action: getContactByPhoneAction, props: { phone_number: '+14155550101' } })).resolves.toMatchObject({
      found: false,
      contact_id: null,
      phone_number: '+14155550101',
    });
  });

  it('list_calls accepts a bare array response defensively', async () => {
    stubFetch([{ status: 200, body: [CALL] }]);
    await expect(runAction({ action: listCallsAction, props: {} })).resolves.toMatchObject({
      count: 1,
      has_more: false,
      pagination_key: null,
    });
  });
});

describe('dropdowns', () => {
  const auth = { type: 'CUSTOM_AUTH', props: { apiKey: API_KEY } };
  const loadOptions = (dropdown: { options: unknown }) => invoke({ fn: dropdown.options, self: dropdown, args: [{ auth }, {}] });

  it('call dropdown uses POST /v3/list-calls and reads items', async () => {
    const calls = stubFetch([{ status: 200, body: { items: [CALL], has_more: false } }]);
    const result = toDropdown(await loadOptions(callIdDropdown));
    expect(calls[0].method).toBe('POST');
    expect(calls[0].url.pathname).toBe('/v3/list-calls');
    expect(calls[0].body).toEqual({ limit: 100, sort_order: 'descending' });
    expect(result.options[0].value).toBe('call_1');
  });

  it('agent dropdown pages through /v2/list-agents and dedupes', async () => {
    const calls = stubFetch([
      { status: 200, body: { items: [{ agent_id: 'a1', agent_name: 'One' }], pagination_key: 'p2', has_more: true } },
      { status: 200, body: { items: [{ agent_id: 'a1', agent_name: 'One' }, { agent_id: 'a2', agent_name: 'Two' }], has_more: false } },
    ]);
    const result = toDropdown(await loadOptions(agentIdDropdown({ displayName: 'Agent' })));
    expect(calls.map((call) => call.url.searchParams.get('pagination_key'))).toEqual([null, 'p2']);
    expect(result.options.map((option) => option.value)).toEqual(['a1', 'a2']);
    expect(calls.every((call) => JSON.stringify(call.body ?? '').includes('voice'))).toBe(true);
  });

  it('agent dropdown stops after 10 pages', async () => {
    let page = 0;
    const calls = stubFetch(() => {
      page += 1;
      return { status: 200, body: { items: [{ agent_id: `a${page}` }], pagination_key: `p${page}`, has_more: true } };
    });
    const result = toDropdown(await loadOptions(agentIdDropdown({ displayName: 'Agent' })));
    expect(calls).toHaveLength(10);
    expect(result.options).toHaveLength(10);
  });

  it('dropdown shows a disabled reason on error', async () => {
    stubFetch([{ status: 401, body: { error_message: 'bad' } }]);
    const result = toDropdown(await loadOptions(callIdDropdown));
    expect(result.disabled).toBe(true);
    expect(result.placeholder).toContain('Error loading calls');
  });
});

describe('webhook triggers', () => {
  const now = 1760000000000;

  function signedPayload({ event, callId = 'call_1', timestamp = now, key = API_KEY }: { event: string; callId?: string; timestamp?: number; key?: string }) {
    const rawBody = JSON.stringify({ event, call: { ...CALL, call_id: callId } });
    const digest = createHmac('sha256', key).update(rawBody + String(timestamp)).digest('hex');
    return { body: JSON.parse(rawBody), rawBody, headers: { 'X-Retell-Signature': `v=${timestamp},d=${digest}` } };
  }

  function triggerContext({ payload, store = makeStore() }: { payload: unknown; store?: ReturnType<typeof makeStore> }) {
    return { auth: { type: 'CUSTOM_AUTH', props: { apiKey: API_KEY } }, propsValue: {}, store, payload };
  }

  function runTrigger({ trigger, context }: { trigger: { run: unknown }; context: unknown }) {
    return invoke({ fn: trigger.run, self: trigger, args: [context] });
  }

  it('verifies v=<ms>,d=<hmac(rawBody+ts)>', () => {
    const payload = signedPayload({ event: 'call_ended' });
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: payload.rawBody, headers: payload.headers, nowMs: now })).toBe(true);
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: Buffer.from(payload.rawBody), headers: payload.headers, nowMs: now })).toBe(true);
    expect(verifyRetellSignature({ apiKey: 'other', rawBody: payload.rawBody, headers: payload.headers, nowMs: now })).toBe(false);
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: payload.rawBody + ' ', headers: payload.headers, nowMs: now })).toBe(false);
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: payload.rawBody, headers: {}, nowMs: now })).toBe(false);
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: undefined, headers: payload.headers, nowMs: now })).toBe(false);
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: payload.rawBody, headers: { 'x-retell-signature': 'garbage' }, nowMs: now })).toBe(false);
  });

  it('accepts deliveries up to 15 minutes old (queue lag) and rejects older or far-future ones', () => {
    const old = signedPayload({ event: 'call_ended', timestamp: now - 14 * 60 * 1000 });
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: old.rawBody, headers: old.headers, nowMs: now })).toBe(true);
    const stale = signedPayload({ event: 'call_ended', timestamp: now - 16 * 60 * 1000 });
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: stale.rawBody, headers: stale.headers, nowMs: now })).toBe(false);
    const future = signedPayload({ event: 'call_ended', timestamp: now + 6 * 60 * 1000 });
    expect(verifyRetellSignature({ apiKey: API_KEY, rawBody: future.rawBody, headers: future.headers, nowMs: now })).toBe(false);
  });

  it.each([
    [newCallTrigger, 'call_started'],
    [callEndedTrigger, 'call_ended'],
    [callAnalyzedTrigger, 'call_analyzed'],
  ] as const)('%s fires only for its event, once per call', async (trigger, event) => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const store = makeStore();
    const own = signedPayload({ event });
    const first = await runTrigger({ trigger, context: triggerContext({ payload: own, store }) });
    expect(first).toEqual([{ event, call: own.body.call, [DEDUPE_KEY_PROPERTY]: `${event}:call_1` }]);
    expect(await runTrigger({ trigger, context: triggerContext({ payload: own, store }) })).toEqual([]);
    const other = signedPayload({ event: event === 'call_started' ? 'call_ended' : 'call_started' });
    expect(await runTrigger({ trigger, context: triggerContext({ payload: other, store }) })).toEqual([]);
    const second = signedPayload({ event, callId: 'call_2' });
    expect(await runTrigger({ trigger, context: triggerContext({ payload: second, store }) })).toHaveLength(1);
  });

  it('ignores unsigned or forged deliveries', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const forged = signedPayload({ event: 'call_analyzed', key: 'attacker' });
    expect(await runTrigger({ trigger: callAnalyzedTrigger, context: triggerContext({ payload: forged }) })).toEqual([]);
    const unsigned = { ...signedPayload({ event: 'call_analyzed' }), headers: {} };
    expect(await runTrigger({ trigger: callAnalyzedTrigger, context: triggerContext({ payload: unsigned }) })).toEqual([]);
  });

  it('tags each event with the platform dedupe key and keeps the fallback list bounded', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const store = makeStore();
    store.data.set('retell_call_ended_deliveries', Array.from({ length: 500 }, (_, i) => `call_ended:old_${i}`));
    const out = await runTrigger({ trigger: callEndedTrigger, context: triggerContext({ payload: signedPayload({ event: 'call_ended' }), store }) });
    expect(out[0]).toMatchObject({ event: 'call_ended', [DEDUPE_KEY_PROPERTY]: 'call_ended:call_1' });
    const kept = store.data.get('retell_call_ended_deliveries');
    expect(Array.isArray(kept) && kept.length).toBe(500);
    expect(Array.isArray(kept) && kept[kept.length - 1]).toBe('call_ended:call_1');
    expect(store.data.has('retell_call_ended_call_1')).toBe(false);
  });

  it('sample data matches the real {event, call} shape', () => {
    expect(newCallTrigger.sampleData).toMatchObject({ event: 'call_started', call: { call_id: expect.any(String) } });
    expect(callAnalyzedTrigger.sampleData).toMatchObject({ event: 'call_analyzed', call: { call_analysis: expect.any(Object) } });
  });
});
