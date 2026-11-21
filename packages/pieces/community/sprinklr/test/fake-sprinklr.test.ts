import { createServer, Server } from 'node:http';
import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { FAKE_SPRINKLR_CLIENT, FakeSprinklr, FakeSprinklrOptions, startFakeSprinklr } from './support/fake-sprinklr';

const CALLBACK = FAKE_SPRINKLR_CLIENT.redirectUris[0];
const T0 = 1_780_000_000_000;

let fake: FakeSprinklr | undefined;
let clock = T0;
const servers: Server[] = [];

afterEach(async () => {
  await fake?.close();
  fake = undefined;
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
});

async function start(options: FakeSprinklrOptions = {}): Promise<FakeSprinklr> {
  clock = T0;
  fake = await startFakeSprinklr({ now: () => clock, ...options });
  return fake;
}

async function authorizeCode(f: FakeSprinklr): Promise<string> {
  const url = `${f.baseUrl}/oauth/authorize?client_id=${FAKE_SPRINKLR_CLIENT.apiKey}&redirect_uri=${encodeURIComponent(CALLBACK)}&response_type=code&state=xyz`;
  const res = await fetch(url, { redirect: 'manual' });
  expect(res.status).toBe(302);
  const location = new URL(res.headers.get('location') ?? '');
  expect(location.origin + location.pathname).toBe(CALLBACK);
  expect(location.searchParams.get('state')).toBe('xyz');
  return location.searchParams.get('code') ?? '';
}

async function tokenCall({ f, form, query = '' }: { f: FakeSprinklr; form: Record<string, string>; query?: string }): Promise<Response> {
  return fetch(`${f.baseUrl}/oauth/token${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: FAKE_SPRINKLR_CLIENT.apiKey, client_secret: FAKE_SPRINKLR_CLIENT.secret, ...form }).toString(),
  });
}

async function connect(f: FakeSprinklr): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: string }> {
  const code = await authorizeCode(f);
  const res = await tokenCall({ f, form: { grant_type: 'authorization_code', code, redirect_uri: CALLBACK }, query: `?redirect_uri=${CALLBACK}` });
  expect(res.status).toBe(200);
  return res.json();
}

function api({ f, path, method, body, token: tokenOverride, key }: { f: FakeSprinklr; path: string; method?: string; body?: unknown; token?: string; key?: string | null }): Promise<Response> {
  const token = tokenOverride ?? f.state.tokens[FAKE_SPRINKLR_CLIENT.apiKey]?.accessToken ?? f.control.issueToken().accessToken;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (key !== null) headers['Key'] = key ?? FAKE_SPRINKLR_CLIENT.apiKey;
  return fetch(`${f.baseUrl}/api/v3${path}`, { method: method ?? 'GET', headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

function portOf(server: Server): number {
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('The receiver has no TCP address');
  return address.port;
}

async function data(res: Response): Promise<ReturnType<typeof JSON.parse>> {
  const body = await res.json();
  return body.data;
}

const newCase = {
  subject: 'Printer on fire',
  description: 'It is on fire',
  channelType: 'EMAIL',
  contactInfo: { email: 'jane@example.com', fullName: 'Jane Doe' },
  priority: 'High',
  workflow: { customProperties: { spr_uc_type: 'Complaint', region: ['EU'] }, queues: [{ queueId: 103197 }] },
  commentDTO: { comment: 'First comment' },
};

describe('fake sprinklr oauth', () => {
  it('redirects the authorize call and exchanges the code once', async () => {
    const f = await start();
    const code = await authorizeCode(f);
    const first = await tokenCall({ f, form: { grant_type: 'authorization_code', code, redirect_uri: CALLBACK } });
    const body = await first.json();
    expect(body).toMatchObject({ token_type: 'Bearer', expires_in: 2591999 });
    const again = await tokenCall({ f, form: { grant_type: 'authorization_code', code, redirect_uri: CALLBACK } });
    expect(again.status).toBe(400);
    expect(await again.json()).toMatchObject({ error: 'invalid_grant' });
    expect(f.state.counters.authorizationCode).toBe(2);
  });

  it('rejects an unknown client or a foreign callback on authorize with HTML 400', async () => {
    const f = await start();
    const res = await fetch(`${f.baseUrl}/oauth/authorize?client_id=${FAKE_SPRINKLR_CLIENT.apiKey}&redirect_uri=${encodeURIComponent('https://evil.example/cb')}&response_type=code`, { redirect: 'manual' });
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('expires the code after ten minutes', async () => {
    const f = await start();
    const code = await authorizeCode(f);
    clock += 10 * 60 * 1000 + 1;
    const res = await tokenCall({ f, form: { grant_type: 'authorization_code', code, redirect_uri: CALLBACK } });
    expect(await res.json()).toMatchObject({ error: 'invalid_grant' });
  });

  it('rotates tokens on refresh and the old refresh token stops working', async () => {
    const f = await start();
    const first = await connect(f);
    const refreshed = await tokenCall({ f, form: { grant_type: 'refresh_token', refresh_token: first.refresh_token, redirect_uri: CALLBACK } });
    expect(refreshed.status).toBe(200);
    const second = await refreshed.json();
    expect(second.access_token).not.toBe(first.access_token);
    expect(second.refresh_token).not.toBe(first.refresh_token);
    const reused = await tokenCall({ f, form: { grant_type: 'refresh_token', refresh_token: first.refresh_token, redirect_uri: CALLBACK } });
    expect(reused.status).toBe(400);
    expect(await reused.json()).toMatchObject({ error: 'invalid_grant' });
    expect((await api({ f, path: '/me', token: first.access_token })).status).toBe(401);
    expect((await api({ f, path: '/me', token: second.access_token })).status).toBe(200);
    expect(f.state.counters.refreshToken).toBe(2);
  });

  it('fails a refresh without redirect_uri', async () => {
    const f = await start();
    const first = await connect(f);
    const res = await tokenCall({ f, form: { grant_type: 'refresh_token', refresh_token: first.refresh_token } });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: 'invalid_grant', error_description: 'redirect_uri is required' });
  });

  it('accepts a refresh with redirect_uri only in the query string', async () => {
    const f = await start();
    const first = await connect(f);
    const res = await tokenCall({ f, form: { grant_type: 'refresh_token', refresh_token: first.refresh_token }, query: `?redirect_uri=${CALLBACK}` });
    expect(res.status).toBe(200);
  });

  it('keeps one token per API key: a new code exchange kills the old token', async () => {
    const f = await start();
    const first = await connect(f);
    const second = await connect(f);
    expect((await api({ f, path: '/me', token: first.access_token })).status).toBe(401);
    const refresh = await tokenCall({ f, form: { grant_type: 'refresh_token', refresh_token: first.refresh_token, redirect_uri: CALLBACK } });
    expect(refresh.status).toBe(400);
    expect((await api({ f, path: '/me', token: second.access_token })).status).toBe(200);
  });

  it('honours a short token TTL in expires_in and rejects the token after expiry', async () => {
    const f = await start({ tokenTtlSeconds: 600 });
    const t = await connect(f);
    expect(t.expires_in).toBe(600);
    clock += 599_000;
    expect((await api({ f, path: '/me', token: t.access_token })).status).toBe(200);
    clock += 1_000;
    const res = await api({ f, path: '/me', token: t.access_token });
    expect(res.status).toBe(401);
    expect((await res.json()).errors[0]).toMatchObject({ code: 'UNAUTHORIZED', message: 'Access token expired' });
  });

  it('forces 401 on current tokens with expireAccessTokens', async () => {
    const f = await start();
    const t = await connect(f);
    f.control.expireAccessTokens();
    expect((await api({ f, path: '/me', token: t.access_token })).status).toBe(401);
  });
});

describe('fake sprinklr api', () => {
  it('requires both the bearer token and the Key header', async () => {
    const f = await start();
    const t = f.control.issueToken();
    const noKey = await api({ f, path: '/me', token: t.accessToken, key: null });
    expect(noKey.status).toBe(401);
    expect((await noKey.json()).errors[0]).toMatchObject({ code: 'UNAUTHORIZED' });
    const noBearer = await fetch(`${f.baseUrl}/api/v3/me`, { headers: { Key: FAKE_SPRINKLR_CLIENT.apiKey } });
    expect(noBearer.status).toBe(401);
    expect((await api({ f, path: '/me', token: t.accessToken })).status).toBe(200);
    const v2 = await fetch(`${f.baseUrl}/api/v2/me`, { headers: { Authorization: `Bearer ${t.accessToken}`, Key: FAKE_SPRINKLR_CLIENT.apiKey } });
    expect(await v2.json()).toMatchObject({ email: 'service.user@example.com' });
  });

  it('creates, gets and patches a case', async () => {
    const f = await start();
    const created = await api({ f, path: '/case', method: 'POST', body: newCase });
    expect(created.status).toBe(201);
    const c = await data(created);
    expect(c.subject).toBe(`#${c.caseNumber} Email Printer on fire`);
    expect(c.workflow.customProperties).toEqual({ spr_uc_type: ['Complaint'], region: ['EU'] });
    expect(c.createdTime).toBe(T0);

    const got = await data(await api({ f, path: `/case?caseNumber=${c.caseNumber}` }));
    expect(got).toHaveLength(1);
    expect(got[0].id).toBe(c.id);
    expect(await data(await api({ f, path: '/case?caseNumber=1' }))).toEqual([]);

    clock += 5000;
    const patched = await api({
      f,
      path: `/case?caseNumber=${c.caseNumber}`,
      method: 'PATCH',
      body: { status: 'Closed', workflow: { syncedSelectedCustomProperties: { region: ['US'] }, addedQueues: [7], removedQueues: [103197], assignment: { assigneeId: '42', assigneeType: 'USER' } } },
    });
    expect(patched.status).toBe(204);
    const after = (await data(await api({ f, path: `/case?id=${c.id}` })))[0];
    expect(after).toMatchObject({ status: 'Closed', subject: c.subject, version: 1, modifiedTime: T0 + 5000 });
    expect(after.workflow.customProperties).toEqual({ spr_uc_type: ['Complaint'], region: ['US'] });
    expect(after.workflow.queues.map((q: { queueId: number }) => q.queueId)).toEqual([7]);
    expect(after.workflow.assignment).toMatchObject({ assigneeId: '42', assignmentTime: T0 + 5000 });
  });

  it('requires channelType and contactInfo on create', async () => {
    const f = await start();
    expect((await api({ f, path: '/case', method: 'POST', body: { subject: 'x', contactInfo: { email: 'a@b.c' } } })).status).toBe(400);
    expect((await api({ f, path: '/case', method: 'POST', body: { subject: 'x', channelType: 'EMAIL' } })).status).toBe(400);
    expect((await api({ f, path: '/case', method: 'POST', body: { channelType: 'email', contactInfo: { email: 'a@b.c' } } })).status).toBe(400);
  });

  it('clears fields not sent on PUT', async () => {
    const f = await start();
    const c = await data(await api({ f, path: '/case', method: 'POST', body: newCase }));
    const res = await api({ f, path: `/case?id=${c.id}`, method: 'PUT', body: { subject: 'Only subject' } });
    expect(res.status).toBe(200);
    const after = (await data(await api({ f, path: `/case?id=${c.id}` })))[0];
    expect(after.subject).toBe('Only subject');
    expect(after.description).toBeUndefined();
    expect(after.priority).toBeUndefined();
    expect(after.workflow.customProperties).toEqual({});
    expect(after.workflow.queues).toEqual([]);
  });

  it('adds comments by case number only', async () => {
    const f = await start();
    const c = await data(await api({ f, path: '/case', method: 'POST', body: newCase }));
    const res = await api({ f, path: '/comment', method: 'POST', body: { entityType: 'CASE', entityId: String(c.caseNumber), text: 'hi', isPrivate: true } });
    expect(res.status).toBe(200);
    expect(await data(res)).toMatchObject({ text: 'hi', entityType: 'CASE', entityId: String(c.caseNumber), commentingUser: 60000000, createdTime: T0, isPrivate: true });
    expect((await api({ f, path: '/comment', method: 'POST', body: { entityType: 'CASE', entityId: c.id, text: 'hi' } })).status).toBe(404);
    expect((await api({ f, path: '/comment', method: 'POST', body: { entityType: 'CASE', entityId: c.caseNumber, text: 'hi' } })).status).toBe(400);
    expect(f.state.comments).toHaveLength(2);
  });

  it('finds profiles by id, channel and email search', async () => {
    const f = await start();
    await api({ f, path: '/case', method: 'POST', body: newCase });
    const byChannel = await data(await api({ f, path: `/profile?channelTypeChannelId=${encodeURIComponent('EMAIL~jane@example.com')}` }));
    expect(byChannel).toHaveLength(1);
    expect(await data(await api({ f, path: `/profile?id=${byChannel[0].id}` }))).toHaveLength(1);
    const search = await data(await api({ f, path: '/search/PROFILE', method: 'POST', body: { filter: { type: 'IN', key: 'contact.email', values: ['jane@example.com'] }, page: { size: 5 } } }));
    expect(search.results[0].contact).toMatchObject({ fullName: 'Jane Doe', email: 'jane@example.com' });
  });

  it('searches cases with the filter grammar, sorts and pages with a cursor', async () => {
    const f = await start();
    f.control.seedCases(5, (i) => ({ workflow: { customProperties: { tier: [i % 2 === 0 ? 'gold' : 'silver'] }, queues: [{ queueId: 100 + i, assignmentTime: T0 }] } }));
    const all = f.state.cases;
    expect(all.map((c) => c.createdTime)).toEqual([T0 - 240000, T0 - 180000, T0 - 120000, T0 - 60000, T0]);
    const body = { filter: { type: 'AND', filters: [{ type: 'GT', key: 'createdTime', values: [String(T0 - 200000)] }, { type: 'OR', filters: [{ type: 'IN', key: 'workflow.customProperties.tier', values: ['gold'] }, { type: 'EQUALS', key: 'workflow.queues.queueId', values: ['103'] }] }] }, sorts: [{ key: 'createdTime', order: 'DESC' }], page: { size: 2 } };
    const page1 = await data(await api({ f, path: '/search/case', method: 'POST', body }));
    expect(page1.count).toBe(3);
    expect(page1.results.map((c: { caseNumber: number }) => c.caseNumber)).toEqual([all[4].caseNumber, all[3].caseNumber]);
    const page2 = await data(await api({ f, path: `/search/CASE?id=${page1.cursor}` }));
    expect(page2.results.map((c: { caseNumber: number }) => c.caseNumber)).toEqual([all[2].caseNumber]);
    expect(page2.cursor).toBeUndefined();
    const lte = await data(await api({ f, path: '/search/case', method: 'POST', body: { filter: { type: 'LTE', key: 'modifiedTime', values: [String(T0 - 180000)] }, sorts: [{ key: 'createdTime', order: 'ASC' }], page: { size: 10 } } }));
    expect(lte.count).toBe(2);
    const lt = await data(await api({ f, path: '/search/case', method: 'POST', body: { filter: { type: 'AND', filters: [{ type: 'GTE', key: 'createdTime', values: [String(T0 - 60000)] }, { type: 'LT', key: 'createdTime', values: [String(T0)] }] }, page: { size: 10 } } }));
    expect(lt.count).toBe(1);
  });

  it('expires a cursor after five minutes', async () => {
    const f = await start();
    f.control.seedCases(3);
    const page1 = await data(await api({ f, path: '/search/case', method: 'POST', body: { page: { size: 1 } } }));
    clock += 5 * 60 * 1000;
    const res = await api({ f, path: `/search/case?id=${page1.cursor}` });
    expect(res.status).toBe(400);
    expect((await res.json()).errors[0].code).toBe('INVALID_CURSOR');
  });

  it('accepts the cursor parameter name it is configured for, with an id= prefix when asked', async () => {
    const f = await start({ cursorParam: 'cursor', cursorIdPrefix: true });
    f.control.seedCases(3);
    const page1 = await data(await api({ f, path: '/search/case', method: 'POST', body: { page: { size: 1 } } }));
    expect(page1.cursor).toMatch(/^id=/);
    const bare = page1.cursor.slice(3);
    expect((await api({ f, path: `/search/case?id=${bare}` })).status).toBe(400);
    expect((await api({ f, path: `/search/case?cursor=${bare}` })).status).toBe(200);
  });

  it('runs a report with jsonResponse and paging', async () => {
    const f = await start();
    f.state.reportRowCount = 3;
    const body = { groupBys: [{ heading: 'Channel' }], projections: [{ heading: 'Volume' }], page: 0, pageSize: 2, jsonResponse: true };
    const res = await (await api({ f, path: '/reports/query', method: 'POST', body })).json();
    expect(res).toMatchObject({ errors: [], metadata: {}, data: { hasMore: true, data: [{ Channel: 'Channel 1', Volume: 10 }, { Channel: 'Channel 2', Volume: 20 }] } });
    const columnar = await data(await api({ f, path: '/reports/query', method: 'POST', body: { ...body, page: 1, jsonResponse: false } }));
    expect(columnar).toEqual({ headings: ['Channel', 'Volume'], rows: [['Channel 3', 30]], hasMore: false });
  });

  it('injects rate limits and HTML 500s, then recovers', async () => {
    const f = await start();
    f.control.failNext(1, '429');
    f.control.failNext(1, '403-developer-over-rate');
    f.control.failNext(1, '403-account-qps');
    f.control.failNext(1, '403-account-rate');
    f.control.failNext(1, '500-html');
    const r1 = await api({ f, path: '/me' });
    expect(r1.status).toBe(429);
    expect(r1.headers.get('retry-after')).toBe('1');
    expect(await (await api({ f, path: '/me' })).text()).toContain('Developer Over Rate');
    expect(await (await api({ f, path: '/me' })).text()).toContain('Account Over Queries Per Second Limit');
    const r4 = await api({ f, path: '/me' });
    expect(r4.status).toBe(403);
    expect(await r4.text()).toContain('Account Over Rate Limit');
    const r5 = await api({ f, path: '/me' });
    expect(r5.status).toBe(500);
    expect(r5.headers.get('content-type')).toContain('text/html');
    expect((await api({ f, path: '/me' })).status).toBe(200);
  });

  it('lives under the segment when one is set and 404s without it', async () => {
    const f = await start({ segment: 'prod2' });
    expect(f.baseUrl).toBe(`${f.origin}/prod2`);
    expect((await api({ f, path: '/me' })).status).toBe(200);
    const t = f.state.tokens[FAKE_SPRINKLR_CLIENT.apiKey];
    const bare = await fetch(`${f.origin}/api/v3/me`, { headers: { Authorization: `Bearer ${t.accessToken}`, Key: FAKE_SPRINKLR_CLIENT.apiKey } });
    expect(bare.status).toBe(404);
    expect(await bare.json()).toEqual({ message: 'Path /api/v3/me not found' });
    expect(await authorizeCode(f)).toBeTruthy();
  });

  it('switches between wrapped and bare envelopes', async () => {
    const wrapped = await start();
    const w = await (await api({ f: wrapped, path: '/case?caseNumber=1' })).json();
    expect(w).toEqual({ data: [], errors: [] });
    expect(await (await api({ f: wrapped, path: '/me' })).json()).toMatchObject({ data: [{ email: 'service.user@example.com' }] });
    await wrapped.close();
    fake = undefined;
    const bare = await start({ envelope: 'bare' });
    bare.control.seedCases(1);
    expect(await (await api({ f: bare, path: `/case?caseNumber=${bare.state.cases[0].caseNumber}` })).json()).toHaveLength(1);
    expect(await (await api({ f: bare, path: '/search/case', method: 'POST', body: { page: { size: 5 } } })).json()).toMatchObject({ count: 1 });
    expect(await (await api({ f: bare, path: '/me' })).json()).toMatchObject({ email: 'service.user@example.com' });
  });
});

describe('fake sprinklr webhooks', () => {
  async function receiver(status: number): Promise<{ url: string; calls: { body: string; signature?: string }[] }> {
    const calls: { body: string; signature?: string }[] = [];
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        const sig = req.headers['x-hub-signature'];
        calls.push({ body: Buffer.concat(chunks).toString(), signature: Array.isArray(sig) ? sig[0] : sig });
        res.writeHead(status).end();
      });
    });
    servers.push(server);
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    return { url: `http://127.0.0.1:${portOf(server)}/hook`, calls };
  }

  it('verifies by calling back with {}, activates, emits signed events and deletes', async () => {
    const f = await start();
    const hook = await receiver(200);
    const created = await api({ f, path: '/webhook-subscriptions', method: 'POST', body: { name: 'ap', url: hook.url, preSharedKey: 'psk', subscriptions: ['CASE_CREATED', 'CASE_UPDATED'] } });
    expect(created.status).toBe(201);
    const sub = await data(created);
    expect(sub).toMatchObject({ verified: false, active: false });
    expect((await api({ f, path: `/webhook-subscriptions/action?subscriptionId=${sub.id}&action=activate`, method: 'POST' })).status).toBe(400);
    expect(await data(await api({ f, path: `/webhook-subscriptions/action?subscriptionId=${sub.id}&action=verify`, method: 'POST' }))).toBe(true);
    expect(hook.calls[0]).toEqual({ body: '{}', signature: undefined });
    expect(await data(await api({ f, path: `/webhook-subscriptions/action?subscriptionId=${sub.id}&action=activate`, method: 'POST' }))).toBe(true);

    const [seeded] = f.control.seedCases(1);
    expect(await f.control.emitCaseEvent({ type: 'case.create', target: seeded.caseNumber })).toEqual([{ subscriptionId: sub.id, status: 200 }]);
    const event = hook.calls[1];
    expect(event.signature).toBe(`sha256=${createHmac('sha256', 'psk').update(event.body).digest('hex')}`);
    expect(JSON.parse(event.body)).toMatchObject({ type: 'case.create', eventTime: T0, payload: { caseNumber: seeded.caseNumber }, subscriptionDetails: { subscriptionId: sub.id } });
    expect(await f.control.emitCaseEvent({ type: 'case.delete', target: seeded })).toEqual([]);

    expect((await api({ f, path: `/webhook-subscriptions?subscriptionId=${sub.id}`, method: 'DELETE' })).status).toBe(200);
    expect(f.state.subscriptions).toHaveLength(0);
  });

  it('leaves the subscription unverified when the callback is not 2xx', async () => {
    const f = await start();
    const hook = await receiver(404);
    const sub = await data(await api({ f, path: '/webhook-subscriptions', method: 'POST', body: { name: 'ap', url: hook.url, preSharedKey: 'psk', subscriptions: ['CASE_CREATED'] } }));
    expect(await data(await api({ f, path: `/webhook-subscriptions/action?subscriptionId=${sub.id}&action=verify`, method: 'POST' }))).toBe(false);
    expect(f.state.deliveries[0]).toMatchObject({ kind: 'verify', status: 404 });
  });
});
