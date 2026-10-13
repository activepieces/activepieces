import crypto from 'crypto';
import { Store } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { performSearchAction } from '../src/lib/actions/perform-search';
import { getContentsAction } from '../src/lib/actions/get-contents';
import { generateAnswerAction } from '../src/lib/actions/generate-answer';
import { findSimilarLinksAction } from '../src/lib/actions/find-similar-links';
import { createAgentRunAction } from '../src/lib/actions/agent/create-agent-run';
import { getAgentRunAction } from '../src/lib/actions/agent/get-agent-run';
import { listAgentRunsAction } from '../src/lib/actions/agent/list-agent-runs';
import { cancelAgentRunAction } from '../src/lib/actions/agent/cancel-agent-run';
import { newSearchMonitorResultsTrigger as monitorTrigger } from '../src/lib/triggers/new-search-monitor-results';
import { exaWebhookSignature } from '../src/lib/common/webhook-signature';
import { exaInput } from '../src/lib/common/client';
import { exa } from '../src/index';
import { exaAuth } from '../src/lib/auth';
import { asWebhook, fail, lastRequest, memoryStore, ok, runAction, sendRequest, webhookContext } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

const RUN = {
  id: 'agent_run_01',
  object: 'agent_run',
  status: 'completed',
  stopReason: 'schema_satisfied',
  createdAt: '2026-09-29T10:00:00.000Z',
  completedAt: '2026-09-29T10:01:00.000Z',
  request: { query: 'q', effort: 'low' },
  output: {
    text: 'answer',
    structured: { companies: [] },
    grounding: [
      { field: 'companies', citations: [{ url: 'https://a.com', title: 'A' }, { url: 'https://b.com' }], confidence: 'high' },
    ],
  },
  usage: { agentComputeUnits: 1, searches: 3, emails: 0, phoneNumbers: 0 },
  costDollars: { total: 0.025, agentCompute: 0, search: 0, emails: 0, phoneNumbers: 0 },
};

beforeEach(() => {
  sendRequest.mockReset();
});

function validateKey(auth: string) {
  return exaAuth.validate?.({
    auth,
    server: {
      apiUrl: 'http://localhost:3000',
      publicUrl: 'http://localhost:4200',
      mintOidcToken: async () => 'oidc-token',
    },
  });
}

describe('existing actions keep their default request', () => {
  it('perform_search sends the same body as 0.2.1 when no new prop is set', async () => {
    ok({ body: { results: [{ title: 't' }] } });
    const result = await runAction({ action: performSearchAction, propsValue: { query: 'ai', type: 'auto', numResults: 10 } });
    expect(lastRequest().body).toEqual({ query: 'ai', contents: { text: true }, type: 'auto', numResults: 10 });
    expect(lastRequest().url).toBe('https://api.exa.ai/search');
    expect(result).toEqual([{ title: 't' }]);
  });

  it('perform_search nests text limit, highlights and maxAgeHours under contents', async () => {
    ok({ body: { results: [] } });
    await runAction({
      action: performSearchAction,
      propsValue: {
        query: 'ai',
        textMaxCharacters: 500,
        highlights: true,
        maxAgeHours: 0,
        userLocation: ' us ',
        moderation: true,
      },
    });
    expect(lastRequest().body).toEqual({
      query: 'ai',
      contents: { text: { maxCharacters: 500 }, highlights: true, maxAgeHours: 0 },
      userLocation: 'US',
      moderation: true,
    });
  });

  it('perform_search refuses a country that is not a two-letter code before calling Exa', async () => {
    await expect(
      runAction({ action: performSearchAction, propsValue: { query: 'ai', userLocation: 'United States' } }),
    ).rejects.toThrow(/two-letter country code/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('get_contents drops the deprecated livecrawl when maxAgeHours is set', async () => {
    ok({ body: { results: [] } });
    await runAction({
      action: getContentsAction,
      propsValue: { urls: ['https://a.com'], text: true, livecrawl: 'always', maxAgeHours: 24 },
    });
    expect(lastRequest().body).toEqual({ urls: ['https://a.com'], text: true, maxAgeHours: 24 });
  });

  it('describes only the result fields each action can return', () => {
    const keysOf = (schema: typeof getContentsAction.outputSchema) => schema?.fields[0]?.listItems?.map((field) => field.key);
    expect(keysOf(getContentsAction.outputSchema)).not.toContain('score');
    expect(keysOf(getContentsAction.outputSchema)).toEqual(expect.arrayContaining(['extras', 'subpages', 'summary']));
    expect(keysOf(performSearchAction.outputSchema)).not.toContain('summary');
    expect(keysOf(findSimilarLinksAction.outputSchema)).toEqual(expect.not.arrayContaining(['text', 'highlights', 'summary']));
  });

  it('get_contents keeps livecrawl when maxAgeHours is not set', async () => {
    ok({ body: { results: [] } });
    await runAction({
      action: getContentsAction,
      propsValue: { urls: ['https://a.com'], text: true, livecrawl: 'fallback', summaryQuery: 'who?', extrasLinks: 5 },
    });
    expect(lastRequest().body).toEqual({
      urls: ['https://a.com'],
      text: true,
      livecrawl: 'fallback',
      summary: { query: 'who?' },
      extras: { links: 5 },
    });
  });

  it('generate_answer still returns the answer string and adds optional instructions', async () => {
    ok({ body: { answer: '42', citations: [] } });
    const result = await runAction({
      action: generateAnswerAction,
      propsValue: { query: 'q', text: false, model: 'exa-fast', systemPrompt: 'short' },
    });
    expect(result).toBe('42');
    expect(lastRequest().body).toEqual({ query: 'q', text: false, model: 'exa-fast', systemPrompt: 'short' });
  });
});

describe('custom API call', () => {
  const customApiCall = exa.actions()['custom_api_call'];

  function callWithUrl(url: string) {
    return runAction({
      action: customApiCall,
      propsValue: { url: { url }, method: 'GET', headers: {}, queryParams: {}, failsafe: false },
    });
  }

  it('sends the secret text, not [object Object]', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    await callWithUrl('/agent/runs');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.exa.ai/agent/runs');
    expect(new Headers(fetchSpy.mock.calls[0][1]?.headers).get('x-api-key')).toBe('exa_test_key');
    fetchSpy.mockRestore();
  });

  it('accepts a full URL on api.exa.ai', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    await callWithUrl('https://api.exa.ai/agent/runs');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(new Headers(fetchSpy.mock.calls[0][1]?.headers).get('x-api-key')).toBe('exa_test_key');
    fetchSpy.mockRestore();
  });

  it.each([
    'https://api.exa.ai.evil.io/search',
    'https://evil.io/search',
    'http://api.exa.ai/search',
    'https://user@api.exa.ai/search',
    'https://api.exa.ai:8443/search',
  ])('never sends the API key to %s', async (url) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(callWithUrl(url)).rejects.toThrow(/only sends your Exa API key/);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('custom API call redirects', () => {
  it('does not follow redirects when the option was never saved on the step', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    await runAction({
      action: exa.actions()['custom_api_call'],
      propsValue: { url: { url: '/agent/runs' }, method: 'GET', headers: {}, queryParams: {}, failsafe: false },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][1]?.redirect).toBe('manual');
    fetchSpy.mockRestore();
  });

  it('refuses Follow redirects, which could carry the key to another host', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(
      runAction({
        action: exa.actions()['custom_api_call'],
        propsValue: { url: { url: '/agent/runs' }, method: 'GET', headers: {}, queryParams: {}, failsafe: false, followRedirects: true },
      }),
    ).rejects.toThrow(/Follow redirects is not supported/);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe('legacy actions', () => {
  it('find_similar_links sends the reference URL and filters as before', async () => {
    ok({ body: { results: [{ url: 'https://b.com', score: 0.9 }] } });
    const result = await runAction({
      action: findSimilarLinksAction,
      propsValue: { url: 'https://a.com', numResults: 2, includeDomains: ['b.com'], startPublishedDate: '2026-01-01T00:00:00Z' },
    });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest()).toMatchObject({ method: 'POST', url: 'https://api.exa.ai/findSimilar' });
    expect(lastRequest().body).toEqual({ url: 'https://a.com', numResults: 2, includeDomains: ['b.com'], startPublishedDate: '2026-01-01T00:00:00Z' });
    expect(result).toEqual([{ url: 'https://b.com', score: 0.9 }]);
  });

  it.each([
    [402, /insufficient credits/],
    [429, /rate limit/],
  ])('maps a %s from Exa to a clear message', async (status, message) => {
    fail({ status, body: { error: 'vendor detail' } });
    await expect(runAction({ action: performSearchAction, propsValue: { query: 'q' } })).rejects.toThrow(message);
  });
});

describe('redirects from Exa', () => {
  it.each([
    ['an agent-run action', () => runAction({ action: getAgentRunAction, propsValue: { runId: 'agent_run_01' } })],
    ['a legacy action', () => runAction({ action: performSearchAction, propsValue: { query: 'q' } })],
  ])('%s asks not to follow redirects and fails on a 3xx', async (_name, call) => {
    sendRequest.mockResolvedValueOnce({ status: 302, headers: { location: 'https://elsewhere.example/' }, body: '' });
    await expect(call()).rejects.toThrow(/redirect \(302\)/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().followRedirects).toBe(false);
  });
});

describe('auth.validate', () => {
  it('uses the non-billable list endpoint', async () => {
    ok({ body: { data: [] } });
    await expect(validateKey('k')).resolves.toEqual({ valid: true });
    expect(lastRequest().method).toBe('GET');
    expect(lastRequest().url).toBe('https://api.exa.ai/agent/runs');
    expect(lastRequest().queryParams).toEqual({ limit: '1' });
  });

  it('says invalid key only on 401', async () => {
    fail({ status: 401 });
    await expect(validateKey('k')).resolves.toEqual({ valid: false, error: 'Invalid API Key.' });
  });

  it('says invalid key on 403', async () => {
    fail({ status: 403 });
    await expect(validateKey('k')).resolves.toEqual({ valid: false, error: 'Invalid API Key.' });
  });

  it('does not blame the key on a server error', async () => {
    fail({ status: 503 });
    const result = await validateKey('k');
    expect(result).toMatchObject({ valid: false });
    expect(JSON.stringify(result)).toContain('HTTP 503');
  });
});

describe('input parsing', () => {
  it('accepts numbers sent as text', () => {
    expect(exaInput.optionalInteger({ value: '500', name: 'Limit', min: 1, max: 1000 })).toBe(500);
    expect(() => exaInput.optionalInteger({ value: '1.5', name: 'Limit', min: 1, max: 1000 })).toThrow(/whole number/);
  });

  it('drops blank list entries and treats an empty list as not set', () => {
    expect(exaInput.stringList(['a.com', ' ', 'b.com'])).toEqual(['a.com', 'b.com']);
    expect(exaInput.stringList([' '])).toBeUndefined();
  });
});

describe('agent runs', () => {
  it('defaults effort to low when the caller omits it', async () => {
    ok({ body: { ...RUN, status: 'queued', output: { text: '', structured: null, grounding: [] } } });
    const result = await runAction({ action: createAgentRunAction, propsValue: { query: 'find things' } });
    expect(lastRequest().body).toEqual({ query: 'find things', effort: 'low' });
    expect(result).toMatchObject({ id: 'agent_run_01', status: 'queued' });
  });

  it('refuses a budget on a fixed effort before calling Exa', async () => {
    await expect(
      runAction({ action: createAgentRunAction, propsValue: { query: 'q', effort: 'low', maxCostDollars: 2 } }),
    ).rejects.toThrow(/Auto or Ultra/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('sends budget, schema and metadata for a metered effort', async () => {
    ok({ body: RUN });
    await runAction({
      action: createAgentRunAction,
      propsValue: {
        query: 'q',
        effort: 'auto',
        maxCostDollars: 3,
        outputSchema: '{"type":"object"}',
        metadata: { flow: 'x', empty: '' },
        previousRunId: 'agent_run_00',
      },
    });
    expect(lastRequest().body).toEqual({
      query: 'q',
      effort: 'auto',
      outputSchema: { type: 'object' },
      budget: { maxCostDollars: 3 },
      previousRunId: 'agent_run_00',
      metadata: { flow: 'x' },
    });
  });

  it('rejects an unknown effort', async () => {
    await expect(runAction({ action: createAgentRunAction, propsValue: { query: 'q', effort: 'max' } })).rejects.toThrow(
      /Effort must be one of/,
    );
  });

  it('flattens a run with citations per grounding entry', async () => {
    ok({ body: RUN });
    const result = await runAction({ action: getAgentRunAction, propsValue: { runId: ' agent_run_01 ' } });
    expect(lastRequest().url).toBe('https://api.exa.ai/agent/runs/agent_run_01');
    expect(result).toEqual({
      id: 'agent_run_01',
      status: 'completed',
      stop_reason: 'schema_satisfied',
      created_at: '2026-09-29T10:00:00.000Z',
      completed_at: '2026-09-29T10:01:00.000Z',
      query: 'q',
      effort: 'low',
      output_text: 'answer',
      output_structured: { companies: [] },
      citations: [
        { field: 'companies', url: 'https://a.com', title: 'A', confidence: 'high' },
        { field: 'companies', url: 'https://b.com', title: null, confidence: 'high' },
      ],
      search_count: 3,
      agent_compute_units: 1,
      cost_total: 0.025,
    });
  });

  it.each([
    ['get', getAgentRunAction],
    ['cancel', cancelAgentRunAction],
  ])('%s refuses a blank run id instead of calling the list route', async (_name, action) => {
    await expect(runAction({ action, propsValue: { runId: '   ' } })).rejects.toThrow(/Run ID is required/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('cancel posts to the cancel route', async () => {
    ok({ body: { ...RUN, status: 'cancelled' } });
    await runAction({ action: cancelAgentRunAction, propsValue: { runId: 'agent_run_01' } });
    expect(lastRequest().method).toBe('POST');
    expect(lastRequest().url).toBe('https://api.exa.ai/agent/runs/agent_run_01/cancel');
  });

  it('list returns one page with the cursor, not a total', async () => {
    ok({ body: { object: 'list', data: [RUN], hasMore: true, nextCursor: 'agent_run_00' } });
    const result = await runAction({ action: listAgentRunsAction, propsValue: { limit: 1, cursor: '' } });
    expect(lastRequest().queryParams).toEqual({ limit: '1' });
    expect(result).toMatchObject({ count: 1, has_more: true, next_cursor: 'agent_run_00' });
  });

  it('maps the Agent API error shape into the message', async () => {
    fail({ status: 429, body: { error: { type: 'rate_limit', code: 'CONCURRENCY_LIMIT', message: 'too many runs' } } });
    await expect(runAction({ action: getAgentRunAction, propsValue: { runId: 'x' } })).rejects.toThrow(
      /429.*CONCURRENCY_LIMIT too many runs/,
    );
  });
});

const SECRET = 'whsec_fixture_secret';
const STORE_KEY = 'exa_search_monitor';
const BODY = JSON.stringify({
  id: 'event_1',
  object: 'event',
  type: 'monitor.run.completed',
  data: {
    id: 'run_1',
    monitorId: 'mon_1',
    status: 'completed',
    output: {
      results: [{ title: 'R', url: 'https://r.com', publishedDate: '2026-09-01' }],
      content: 'summary',
      grounding: [{ field: 'content', citations: [{ title: 'R', url: 'https://r.com' }], confidence: 'high' }],
    },
    failReason: null,
    metadata: null,
  },
  createdAt: '2026-09-29T10:00:00.000Z',
});

const NOW_T = String(Math.floor(Date.now() / 1000));

function sign({ body, timestamp, secret }: { body: string; timestamp: string; secret: string }) {
  const v1 = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return `t=${timestamp},v1=${v1}`;
}

describe('signature', () => {
  it('accepts a signature built as t.rawBody', () => {
    const header = sign({ body: BODY, timestamp: NOW_T, secret: SECRET });
    expect(exaWebhookSignature.verify({ secret: SECRET, signatureHeader: header, rawBody: BODY })).toBe(true);
  });

  it('rejects a tampered body, a wrong secret, a parsed body and a garbage header', () => {
    const header = sign({ body: BODY, timestamp: NOW_T, secret: SECRET });
    expect(exaWebhookSignature.verify({ secret: SECRET, signatureHeader: header, rawBody: BODY.replace('R', 'X') })).toBe(false);
    expect(exaWebhookSignature.verify({ secret: 'other', signatureHeader: header, rawBody: BODY })).toBe(false);
    expect(exaWebhookSignature.verify({ secret: SECRET, signatureHeader: header, rawBody: JSON.parse(BODY) })).toBe(false);
    expect(exaWebhookSignature.verify({ secret: SECRET, signatureHeader: 't=1,v1=zz', rawBody: BODY })).toBe(false);
    expect(exaWebhookSignature.verify({ secret: SECRET, signatureHeader: undefined, rawBody: BODY })).toBe(false);
  });

  it('accepts a correctly signed delivery only within 15 minutes, in seconds or milliseconds', () => {
    const nowMs = Date.parse('2026-09-30T12:00:00Z');
    const at = ({ ms, unit }: { ms: number; unit: 's' | 'ms' }) =>
      sign({ body: BODY, timestamp: String(unit === 's' ? Math.floor(ms / 1000) : ms), secret: SECRET });
    const verifyAt = (header: string) => exaWebhookSignature.verify({ secret: SECRET, signatureHeader: header, rawBody: BODY, nowMs });
    expect(verifyAt(at({ ms: nowMs - 60_000, unit: 's' }))).toBe(true);
    expect(verifyAt(at({ ms: nowMs - 60_000, unit: 'ms' }))).toBe(true);
    expect(verifyAt(at({ ms: nowMs - 899_000, unit: 's' }))).toBe(true);
    expect(verifyAt(at({ ms: nowMs - 899_000, unit: 'ms' }))).toBe(true);
    expect(verifyAt(at({ ms: nowMs - 901_000, unit: 's' }))).toBe(false);
    expect(verifyAt(at({ ms: nowMs - 901_000, unit: 'ms' }))).toBe(false);
    expect(verifyAt(at({ ms: nowMs - 16 * 60_000, unit: 's' }))).toBe(false);
    expect(verifyAt(at({ ms: nowMs + 16 * 60_000, unit: 's' }))).toBe(false);
  });

  it('still accepts a delivery that waited 6 minutes in the Activepieces job queue', () => {
    const nowMs = Date.parse('2026-09-30T12:00:00Z');
    const header = sign({ body: BODY, timestamp: String(Math.floor((nowMs - 6 * 60_000) / 1000)), secret: SECRET });
    expect(exaWebhookSignature.verify({ secret: SECRET, signatureHeader: header, rawBody: BODY, nowMs })).toBe(true);
  });
});

describe('new_search_monitor_results trigger', () => {
  const newSearchMonitorResultsTrigger = asWebhook(monitorTrigger);
  const STATE = { [STORE_KEY]: { monitorId: 'mon_1', webhookSecret: SECRET } };

  it('creates a monitor pointed at the webhook URL and stores its id and secret', async () => {
    const { store, data } = memoryStore();
    ok({ status: 201, body: { id: 'mon_1', webhookSecret: SECRET } });
    await newSearchMonitorResultsTrigger.onEnable(
      webhookContext({
        store,
        propsValue: { query: 'battery recycling', period: '1d', numResults: 5, includeHighlights: true },
      }),
    );
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().url).toBe('https://api.exa.ai/monitors');
    expect(lastRequest().body).toEqual({
      name: 'Activepieces flow test-flow-id',
      search: { query: 'battery recycling', numResults: 5, contents: { highlights: true } },
      trigger: { type: 'interval', period: '1d' },
      webhook: { url: 'https://hooks.example.com/abc', events: ['monitor.run.completed'] },
    });
    expect(data[STORE_KEY]).toEqual({ monitorId: 'mon_1', webhookSecret: SECRET, stale: [] });
  });

  it('refuses a non-HTTPS webhook URL before creating a monitor', async () => {
    const { store } = memoryStore();
    await expect(
      newSearchMonitorResultsTrigger.onEnable(
        webhookContext({ store, webhookUrl: 'http://localhost:4200/api/v1/webhooks/abc', propsValue: { query: 'q', period: '1d' } }),
      ),
    ).rejects.toThrow(/public HTTPS address/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('deletes the monitor and fails when Exa returns no webhook secret', async () => {
    const { store, data } = memoryStore();
    ok({ status: 201, body: { id: 'mon_1' } });
    ok({ body: {} });
    await expect(
      newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow(/without a webhook secret/);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(lastRequest().method).toBe('DELETE');
    expect(lastRequest().url).toBe('https://api.exa.ai/monitors/mon_1');
    expect(data[STORE_KEY]).toBeUndefined();
  });

  it('creates the replacement before deleting the monitor left from a failed disable', async () => {
    const { store, data } = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old' } });
    ok({ status: 201, body: { id: 'mon_new', webhookSecret: SECRET } });
    ok({ body: {} });
    await newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[0][0]).toMatchObject({ method: 'POST', url: 'https://api.exa.ai/monitors' });
    expect(sendRequest.mock.calls[1][0]).toMatchObject({ method: 'DELETE', url: 'https://api.exa.ai/monitors/mon_old' });
    expect(data[STORE_KEY]).toEqual({ monitorId: 'mon_new', webhookSecret: SECRET, stale: [] });
  });

  it('keeps the existing monitor and its secret when creating the replacement fails', async () => {
    const { store, data } = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old' } });
    fail({ status: 500 });
    await expect(
      newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow(/500/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest().method).toBe('POST');
    expect(data[STORE_KEY]).toEqual({ monitorId: 'mon_old', webhookSecret: 'old' });
  });

  it('remembers a leftover monitor it could not delete and removes it on the next disable', async () => {
    const { store, data } = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old' } });
    ok({ status: 201, body: { id: 'mon_new', webhookSecret: SECRET } });
    fail({ status: 403 });
    await newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    expect(data[STORE_KEY]).toEqual({ monitorId: 'mon_new', webhookSecret: SECRET, stale: ['mon_old'] });

    sendRequest.mockReset();
    ok({ body: {} });
    ok({ body: {} });
    await newSearchMonitorResultsTrigger.onDisable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls.map(([request]) => request.url)).toEqual([
      'https://api.exa.ai/monitors/mon_new',
      'https://api.exa.ai/monitors/mon_old',
    ]);
    expect(data[STORE_KEY]).toBeUndefined();
  });

  it('keeps the old monitor ID when its delete fails and the cleanup write fails too', async () => {
    const memory = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old', stale: [] } });
    let puts = 0;
    const store: Store = {
      ...memory.store,
      put: async (key, value) => {
        puts += 1;
        if (puts === 2) {
          throw new Error('store down');
        }
        return memory.store.put(key, value);
      },
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    ok({ status: 201, body: { id: 'mon_new', webhookSecret: SECRET } });
    fail({ status: 403 });
    await newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    warn.mockRestore();
    expect(puts).toBe(2);
    expect(memory.data[STORE_KEY]).toEqual({ monitorId: 'mon_new', webhookSecret: SECRET, stale: ['mon_old'] });
  });

  it.each([1, 2])('never loses a monitor ID when store write %i of an enable fails', async (failingPut) => {
    const memory = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old', stale: ['mon_older'] } });
    let puts = 0;
    const store: Store = {
      ...memory.store,
      put: async (key, value) => {
        puts += 1;
        if (puts === failingPut) {
          throw new Error('store down');
        }
        return memory.store.put(key, value);
      },
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    ok({ status: 201, body: { id: 'mon_new', webhookSecret: SECRET } });
    fail({ status: 403 });
    fail({ status: 403 });
    fail({ status: 403 });
    await newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })).catch(() => undefined);
    warn.mockRestore();
    const deleted = sendRequest.mock.calls
      .map(([request]) => request)
      .filter((request) => request.method === 'DELETE')
      .map((request) => String(request.url).split('/').pop());
    const state = memory.data[STORE_KEY];
    const reachable = [state?.monitorId, ...(state?.stale ?? [])];
    for (const id of ['mon_old', 'mon_older']) {
      expect(reachable).toContain(id);
    }
    if (!reachable.includes('mon_new')) {
      expect(deleted).toContain('mon_new');
    }
  });

  it('records the new monitor for cleanup when Exa sends no secret and the rollback delete fails', async () => {
    const { store, data } = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old', stale: [] } });
    ok({ status: 201, body: { id: 'mon_new' } });
    fail({ status: 403 });
    await expect(
      newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow(/mon_new could not be deleted/);
    expect(data[STORE_KEY]).toEqual({ monitorId: 'mon_old', webhookSecret: 'old', stale: ['mon_new'] });
  });

  it('names the new monitor when Exa sends no secret, the rollback fails and the cleanup write fails', async () => {
    const memory = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old', stale: [] } });
    const store: Store = { ...memory.store, put: async () => { throw new Error('store down'); } };
    ok({ status: 201, body: { id: 'mon_new' } });
    fail({ status: 403 });
    await expect(
      newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow(/store down.*mon_new could not be deleted/);
  });

  it('names the new monitor when saving it fails and the rollback fails', async () => {
    const memory = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old', stale: [] } });
    const store: Store = { ...memory.store, put: async () => { throw new Error('store down'); } };
    ok({ status: 201, body: { id: 'mon_new', webhookSecret: SECRET } });
    fail({ status: 403 });
    await expect(
      newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow(/store down.*mon_new could not be deleted/);
    expect(memory.data[STORE_KEY]).toEqual({ monitorId: 'mon_old', webhookSecret: 'old', stale: [] });
  });

  it('names the monitor when a disable cannot delete it', async () => {
    const { store, data } = memoryStore(STATE);
    fail({ status: 403 });
    await expect(
      newSearchMonitorResultsTrigger.onDisable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow(/Could not delete the Exa monitor mon_1/);
    expect(data[STORE_KEY]).toMatchObject({ monitorId: 'mon_1' });
  });

  it('names the monitors still to delete when the cleanup list cannot be saved', async () => {
    const memory = memoryStore({ [STORE_KEY]: { monitorId: 'mon_old', webhookSecret: 'old', stale: [] } });
    let puts = 0;
    const store: Store = {
      ...memory.store,
      put: async (key, value) => {
        puts += 1;
        if (puts === 2) {
          throw new Error('store down');
        }
        return memory.store.put(key, value);
      },
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    ok({ status: 201, body: { id: 'mon_new', webhookSecret: SECRET } });
    fail({ status: 403 });
    await newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/Monitors still to delete: mon_old/);
    warn.mockRestore();
  });

  it('keeps every monitor ID when a disable cannot finish its cleanup', async () => {
    const memory = memoryStore({ [STORE_KEY]: { monitorId: 'mon_1', webhookSecret: SECRET, stale: ['mon_old'] } });
    const store: Store = {
      ...memory.store,
      put: async () => {
        throw new Error('store down');
      },
      delete: async () => {
        throw new Error('store down');
      },
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    ok({ body: {} });
    fail({ status: 403 });
    await newSearchMonitorResultsTrigger.onDisable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    warn.mockRestore();
    expect(memory.data[STORE_KEY]).toEqual({ monitorId: 'mon_1', webhookSecret: SECRET, stale: ['mon_old'] });
  });

  it('names the monitor to delete by hand when the rollback delete fails', async () => {
    const { store } = memoryStore();
    ok({ status: 201, body: { id: 'mon_1' } });
    fail({ status: 403 });
    await expect(
      newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow(/mon_1 could not be deleted/);
  });

  it('deletes the monitor it created if storing the id fails', async () => {
    const { store, failNextPut } = memoryStore();
    failNextPut(new Error('store down'));
    ok({ status: 201, body: { id: 'mon_1', webhookSecret: SECRET } });
    ok({ body: {} });
    await expect(
      newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1h' } })),
    ).rejects.toThrow(/store down/);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(lastRequest().method).toBe('DELETE');
    expect(lastRequest().url).toBe('https://api.exa.ai/monitors/mon_1');
  });

  it('forgets the monitor on disable, treating 404 as already deleted', async () => {
    const { store, data } = memoryStore(STATE);
    fail({ status: 404 });
    await newSearchMonitorResultsTrigger.onDisable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    expect(data[STORE_KEY]).toBeUndefined();
  });

  it('keeps the monitor id when the delete is refused, without retrying', async () => {
    const { store, data } = memoryStore(STATE);
    fail({ status: 403 });
    await expect(
      newSearchMonitorResultsTrigger.onDisable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow();
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(data[STORE_KEY]).toBeDefined();
  });

  it('retries the delete on 429 and 5xx before forgetting the monitor', async () => {
    vi.useFakeTimers();
    const { store, data } = memoryStore(STATE);
    fail({ status: 429 });
    fail({ status: 503 });
    ok({ body: {} });
    const disabling = newSearchMonitorResultsTrigger.onDisable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    await vi.runAllTimersAsync();
    await disabling;
    vi.useRealTimers();
    expect(sendRequest).toHaveBeenCalledTimes(3);
    expect(sendRequest.mock.calls.every(([request]) => request.method === 'DELETE')).toBe(true);
    expect(data[STORE_KEY]).toBeUndefined();
  });

  it('gives up after 3 delete attempts and keeps the monitor id', async () => {
    const { store, data } = memoryStore(STATE);
    fail({ status: 500 });
    fail({ status: 500 });
    fail({ status: 500 });
    vi.useFakeTimers();
    const disabling = expect(
      newSearchMonitorResultsTrigger.onDisable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } })),
    ).rejects.toThrow(/500/);
    await vi.runAllTimersAsync();
    await disabling;
    vi.useRealTimers();
    expect(sendRequest).toHaveBeenCalledTimes(3);
    expect(data[STORE_KEY]).toMatchObject({ monitorId: 'mon_1' });
  });

  it('builder Test runs one search, maps it to the run shape and never creates a monitor', async () => {
    const { store, data } = memoryStore();
    ok({ body: { results: [{ id: 'u', title: 'T', url: 'https://t.com', publishedDate: '2026-09-28 00:00:00.000000000', highlights: ['a', 'b'] }] } });
    const result = await newSearchMonitorResultsTrigger.test(
      webhookContext({ store, propsValue: { query: 'q', period: '1d', numResults: 3, includeDomains: ['t.com'], includeHighlights: true } }),
    );
    expect(monitorTrigger.testStrategy).toBe('TEST_FUNCTION');
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(lastRequest()).toMatchObject({ method: 'POST', url: 'https://api.exa.ai/search' });
    expect(lastRequest().body).toEqual({ query: 'q', numResults: 3, includeDomains: ['t.com'], contents: { highlights: true } });
    expect(result).toEqual([
      expect.objectContaining({
        status: 'completed',
        result_count: 1,
        results: [expect.objectContaining({ url: 'https://t.com', published_date: '2026-09-28T00:00:00.000Z', highlights: 'a\nb' })],
      }),
    ]);
    expect(data).toEqual({});
  });

  it('emits one flattened run for a correctly signed delivery and dedupes a retry', async () => {
    const { store } = memoryStore(STATE);
    const payload = {
      body: JSON.parse(BODY),
      rawBody: BODY,
      headers: { 'Exa-Signature': sign({ body: BODY, timestamp: NOW_T, secret: SECRET }) },
      queryParams: {},
    };
    const context = webhookContext({ store, payload, propsValue: { query: 'q', period: '1d' } });
    const first = await newSearchMonitorResultsTrigger.run(context);
    expect(first).toEqual([
      expect.objectContaining({
        event_id: 'event_1',
        run_id: 'run_1',
        monitor_id: 'mon_1',
        status: 'completed',
        summary: 'summary',
        result_count: 1,
        results: [expect.objectContaining({ title: 'R', url: 'https://r.com', published_date: '2026-09-01' })],
        citations: [{ field: 'content', url: 'https://r.com', title: 'R', confidence: 'high' }],
      }),
    ]);
    const retry = await newSearchMonitorResultsTrigger.run(context);
    expect(retry).toEqual([]);
  });

  it.each([
    ['another monitor', { monitorId: 'mon_other' }, 'monitor.run.completed'],
    ['another event type', {}, 'monitor.run.created'],
  ])('drops a signed delivery for %s', async (_name, dataPatch, type) => {
    const { store } = memoryStore(STATE);
    const parsed = JSON.parse(BODY);
    const body = JSON.stringify({ ...parsed, type, data: { ...parsed.data, ...dataPatch } });
    const result = await newSearchMonitorResultsTrigger.run(
      webhookContext({
        store,
        payload: {
          body: JSON.parse(body),
          rawBody: body,
          headers: { 'exa-signature': sign({ body, timestamp: NOW_T, secret: SECRET }) },
          queryParams: {},
        },
        propsValue: { query: 'q', period: '1d' },
      }),
    );
    expect(result).toEqual([]);
  });

  it('does not re-emit results already delivered, also after a republish', async () => {
    const { store, data } = memoryStore(STATE);
    const deliver = async ({ eventId, monitorId, urls }: { eventId: string; monitorId: string; urls: string[] }) => {
      const parsed = JSON.parse(BODY);
      const body = JSON.stringify({
        ...parsed,
        id: eventId,
        data: { ...parsed.data, id: `run_${eventId}`, monitorId, output: { ...parsed.data.output, results: urls.map((url) => ({ title: url, url })) } },
      });
      return newSearchMonitorResultsTrigger.run(
        webhookContext({
          store,
          payload: { body: JSON.parse(body), rawBody: body, headers: { 'exa-signature': sign({ body, timestamp: NOW_T, secret: SECRET }) }, queryParams: {} },
          propsValue: { query: 'q', period: '1d' },
        }),
      );
    };
    const first = await deliver({ eventId: 'e1', monitorId: 'mon_1', urls: ['https://a.com', 'https://b.com'] });
    expect(first).toEqual([expect.objectContaining({ result_count: 2 })]);

    ok({ body: {} });
    await newSearchMonitorResultsTrigger.onDisable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    ok({ status: 201, body: { id: 'mon_2', webhookSecret: SECRET } });
    await newSearchMonitorResultsTrigger.onEnable(webhookContext({ store, propsValue: { query: 'q', period: '1d' } }));
    expect(data[STORE_KEY]).toMatchObject({ monitorId: 'mon_2' });

    const replayed = await deliver({ eventId: 'e2', monitorId: 'mon_2', urls: ['https://a.com', 'https://b.com'] });
    expect(replayed).toEqual([]);
    const mixed = await deliver({ eventId: 'e3', monitorId: 'mon_2', urls: ['https://b.com', 'https://c.com'] });
    expect(mixed).toEqual([
      expect.objectContaining({ result_count: 1, results: [expect.objectContaining({ url: 'https://c.com' })] }),
    ]);
  });

  it('keeps nothing when saving the dedupe state fails, so Exa\'s retry is still processed', async () => {
    const memory = memoryStore(STATE);
    let failSeenWrite = true;
    const store: Store = {
      ...memory.store,
      put: async (key, value) => {
        if (failSeenWrite && key.startsWith('exa_search_monitor_seen')) {
          failSeenWrite = false;
          throw new Error('store down');
        }
        return memory.store.put(key, value);
      },
    };
    const payload = {
      body: JSON.parse(BODY),
      rawBody: BODY,
      headers: { 'exa-signature': sign({ body: BODY, timestamp: NOW_T, secret: SECRET }) },
      queryParams: {},
    };
    const context = webhookContext({ store, payload, propsValue: { query: 'q', period: '1d' } });
    await expect(newSearchMonitorResultsTrigger.run(context)).rejects.toThrow(/store down/);
    const retry = await newSearchMonitorResultsTrigger.run(context);
    expect(retry).toEqual([expect.objectContaining({ event_id: 'event_1', result_count: 1 })]);
  });

  it('logs why a correctly signed but stale delivery was dropped', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { store } = memoryStore(STATE);
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    const result = await newSearchMonitorResultsTrigger.run(
      webhookContext({
        store,
        payload: { body: JSON.parse(BODY), rawBody: BODY, headers: { 'exa-signature': sign({ body: BODY, timestamp: old, secret: SECRET }) }, queryParams: {} },
        propsValue: { query: 'q', period: '1d' },
      }),
    );
    expect(result).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/signed more than 15 minutes ago/);
    warn.mockRestore();
  });

  it('sends only the new results of a mixed run, with their citations and without the run-wide summary', async () => {
    const { store } = memoryStore({ ...STATE, exa_search_monitor_seen: { eventIds: [], urls: ['https://a.com'] } });
    const parsed = JSON.parse(BODY);
    const body = JSON.stringify({
      ...parsed,
      id: 'event_mixed',
      data: {
        ...parsed.data,
        output: {
          results: [
            { title: 'A', url: 'https://a.com' },
            { title: 'B', url: 'https://b.com' },
          ],
          content: 'A launched X [1]; B launched Y [2].',
          grounding: [
            { field: 'content', citations: [{ title: 'A', url: 'https://a.com' }, { title: 'B', url: 'https://b.com' }], confidence: 'high' },
          ],
        },
      },
    });
    const result = await newSearchMonitorResultsTrigger.run(
      webhookContext({
        store,
        payload: { body: JSON.parse(body), rawBody: body, headers: { 'exa-signature': sign({ body, timestamp: NOW_T, secret: SECRET }) }, queryParams: {} },
        propsValue: { query: 'q', period: '1d' },
      }),
    );
    expect(result).toEqual([
      expect.objectContaining({
        result_count: 1,
        results: [expect.objectContaining({ url: 'https://b.com' })],
        citations: [{ field: 'content', url: 'https://b.com', title: 'B', confidence: 'high' }],
        run_citations: [
          { field: 'content', url: 'https://a.com', title: 'A', confidence: 'high' },
          { field: 'content', url: 'https://b.com', title: 'B', confidence: 'high' },
        ],
        summary: null,
        run_summary: 'A launched X [1]; B launched Y [2].',
        run_result_count: 2,
      }),
    ]);
  });

  it('keeps the summary when every result in the run is new', async () => {
    const { store } = memoryStore(STATE);
    const payload = { body: JSON.parse(BODY), rawBody: BODY, headers: { 'exa-signature': sign({ body: BODY, timestamp: NOW_T, secret: SECRET }) }, queryParams: {} };
    const result = await newSearchMonitorResultsTrigger.run(webhookContext({ store, payload, propsValue: { query: 'q', period: '1d' } }));
    expect(result).toEqual([expect.objectContaining({ summary: 'summary', run_summary: 'summary', run_result_count: 1, result_count: 1 })]);
  });

  it('normalizes the monitor published date to ISO 8601', async () => {
    const { store } = memoryStore(STATE);
    const parsed = JSON.parse(BODY);
    const body = JSON.stringify({
      ...parsed,
      data: { ...parsed.data, output: { ...parsed.data.output, results: [{ title: 'R', url: 'https://r.com', publishedDate: '2026-09-28 00:00:00.000000000' }] } },
    });
    const result = await newSearchMonitorResultsTrigger.run(
      webhookContext({
        store,
        payload: { body: JSON.parse(body), rawBody: body, headers: { 'exa-signature': sign({ body, timestamp: NOW_T, secret: SECRET }) }, queryParams: {} },
        propsValue: { query: 'q', period: '1d' },
      }),
    );
    expect(result).toEqual([expect.objectContaining({ results: [expect.objectContaining({ published_date: '2026-09-28T00:00:00.000Z' })] })]);
  });

  it('drops an unsigned delivery', async () => {
    const { store } = memoryStore(STATE);
    const result = await newSearchMonitorResultsTrigger.run(
      webhookContext({
        store,
        payload: { body: JSON.parse(BODY), rawBody: BODY, headers: {}, queryParams: {} },
        propsValue: { query: 'q', period: '1d' },
      }),
    );
    expect(result).toEqual([]);
  });
});
