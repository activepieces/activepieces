import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';

export const FAKE_SPRINKLR_CLIENT = {
  apiKey: 'fake-sprinklr-key',
  secret: 'fake-sprinklr-secret',
  redirectUris: [
    'http://localhost:4200/redirect',
    'http://localhost:4300/redirect',
    'https://cloud.activepieces.com/redirect',
  ],
};

export async function startFakeSprinklr(
  options: FakeSprinklrOptions = {}
): Promise<FakeSprinklr> {
  const envelope = options.envelope ?? 'wrapped';
  const segment = options.segment?.replace(/^\/+|\/+$/g, '');
  const cursorParam = options.cursorParam ?? 'id';
  const tokenTtlSeconds = options.tokenTtlSeconds ?? 2591999;
  const clients = options.clients ?? {
    [FAKE_SPRINKLR_CLIENT.apiKey]: {
      secret: FAKE_SPRINKLR_CLIENT.secret,
      redirectUris: FAKE_SPRINKLR_CLIENT.redirectUris,
    },
  };
  const user: Json = options.user ?? {
    id: 60000000,
    type: 'PARTNER_ADMIN',
    name: 'Fake Service User',
    email: 'service.user@example.com',
    properties: {},
    customerId: 60000000,
    workspaceId: 60000002,
  };
  let offset = 0;
  const now = (): number => (options.now ?? Date.now)() + offset;
  let nextCaseNumber = 120000001;
  const failures: FakeSprinklrFailure[] = [];
  const codes = new Map<string, { apiKey: string; redirectUri: string; expiresAt: number }>();
  const cursors = new Map<string, { entity: string; ids: string[]; offset: number; size: number; expiresAt: number }>();

  const state: FakeSprinklrState = {
    cases: [],
    profiles: [],
    comments: [],
    subscriptions: [],
    tokens: {},
    counters: { authorize: 0, authorizationCode: 0, refreshToken: 0, tokenErrors: 0 },
    requests: [],
    deliveries: [],
    reportRowCount: 3,
  };

  const issueToken = (apiKey: string): FakeToken => {
    const token: FakeToken = {
      apiKey,
      accessToken: hex(20),
      refreshToken: hex(20),
      expiresAt: now() + tokenTtlSeconds * 1000,
      expiresIn: tokenTtlSeconds,
      revoked: false,
    };
    state.tokens[apiKey] = token;
    return token;
  };

  const upsertProfile = ({ channelType, channelId, contactInfo, time }: { channelType: string; channelId: string; contactInfo: Json; time: number }): FakeProfile => {
    const existing = state.profiles.find((p) =>
      p.profiles.some((s) => s.channelType === channelType && s.channelId === channelId)
    );
    if (existing) return existing;
    const fullName = str(contactInfo['fullName']) ?? [contactInfo['firstName'], contactInfo['lastName']].filter(Boolean).join(' ');
    const profile: FakeProfile = {
      id: hex(12),
      contact: { fullName, email: str(contactInfo['email']), phoneNo: str(contactInfo['phoneNo']) },
      profiles: [{ channelType, channelId, username: channelId, name: fullName }],
      createdTime: time,
      modifiedTime: time,
    };
    state.profiles.push(profile);
    return profile;
  };

  const createCase = ({ input, time }: { input: Json; time: number }): FakeCase => {
    const caseNumber = nextCaseNumber++;
    const channelType = str(input['channelType']) ?? 'EMAIL';
    const contactInfo = obj(input['contactInfo']);
    const channelId = str(input['channelId']) ?? str(channelType === 'SMS' ? contactInfo['phoneNo'] : contactInfo['email']) ?? '';
    upsertProfile({ channelType, channelId, contactInfo, time });
    const workflow = obj(input['workflow']);
    const created: FakeCase = {
      id: hex(12),
      caseNumber,
      subject: `#${caseNumber} ${titleCase(channelType)} ${str(input['subject']) ?? ''}`.trim(),
      description: input['description'],
      version: 0,
      status: input['status'] ?? 'New',
      priority: input['priority'],
      caseType: input['caseType'],
      dueDate: input['dueDate'],
      summary: input['summary'],
      workflow: {
        customProperties: toLists(workflow['customProperties']),
        queues: toQueues({ value: workflow['queues'], time }),
        assignment: workflow['assignment'],
      },
      contact: { id: `${channelType}_${channelId}`, channelType, channelId, fromSnUserId: channelId, name: str(contactInfo['fullName']) },
      createdTime: time,
      modifiedTime: time,
      firstMessageId: `MSG_${caseNumber}_1`,
      latestMessageId: `MSG_${caseNumber}_1`,
      sentiment: 0,
      deleted: false,
    };
    state.cases.push(created);
    const comment = str(obj(input['commentDTO'])['comment']);
    if (comment) addComment({ entityId: String(caseNumber), text: comment, isPrivate: false, time });
    return created;
  };

  const addComment = ({ entityId, text, isPrivate, time }: { entityId: string; text: string; isPrivate: boolean; time: number }): Json => {
    const comment: Json = { id: hex(12), text, commentingUser: user['id'], createdTime: time, modifiedTime: time, entityType: 'CASE', entityId, isPrivate };
    state.comments.push(comment);
    return comment;
  };

  const findCase = (q: URLSearchParams | Json): FakeCase | undefined => {
    const get = (k: string): string | undefined => (q instanceof URLSearchParams ? q.get(k) ?? undefined : str(q[k]));
    const id = get('id');
    const caseNumber = get('caseNumber');
    if (id) return state.cases.find((c) => c.id === id);
    if (caseNumber) return state.cases.find((c) => String(c.caseNumber) === caseNumber);
    return undefined;
  };

  const emitCaseEvent = async ({ type, target }: FakeCaseEvent): Promise<{ subscriptionId: string; status: number }[]> => {
    const payload = typeof target === 'number' ? state.cases.find((c) => c.caseNumber === target) : target;
    if (!payload) throw new Error(`Unknown case ${String(target)}`);
    const webhookType = { 'case.create': 'CASE_CREATED', 'case.update': 'CASE_UPDATED', 'case.delete': 'CASE_DELETED' }[type];
    const targets = state.subscriptions.filter((s) => s.active && s.subscriptions.includes(webhookType));
    return Promise.all(
      targets.map(async (s) => {
        const raw = JSON.stringify({ id: hex(12), type, payload, eventTime: now(), subscriptionDetails: { subscriptionId: s.id } });
        const signature = `sha256=${createHmac('sha256', s.preSharedKey).update(raw).digest('hex')}`;
        const status = await deliver({ url: s.url, body: raw, headers: { 'X-Hub-Signature': signature } });
        state.deliveries.push({ subscriptionId: s.id, url: s.url, kind: 'event', body: raw, signature, status });
        return { subscriptionId: s.id, status };
      })
    );
  };

  const ok = (data: unknown): Reply => ({ status: 200, body: envelope === 'wrapped' ? { data, errors: [] } : data });

  const okCreated = (data: unknown): Reply => ({ ...ok(data), status: 201 });

  const authorize = (q: URLSearchParams): Reply => {
    state.counters.authorize++;
    const clientId = q.get('client_id') ?? '';
    const redirectUri = q.get('redirect_uri') ?? '';
    const client = clients[clientId];
    if (!client) return htmlReply({ status: 400, text: 'Unknown client_id' });
    if (!client.redirectUris.includes(redirectUri)) return htmlReply({ status: 400, text: 'redirect_uri does not match the callback URL of the app' });
    if (q.get('response_type') !== 'code') return htmlReply({ status: 400, text: 'response_type must be code' });
    const code = hex(16);
    codes.set(code, { apiKey: clientId, redirectUri, expiresAt: now() + CODE_LIFETIME_MS });
    const location = new URL(redirectUri);
    location.searchParams.set('code', code);
    const st = q.get('state');
    if (st !== null) location.searchParams.set('state', st);
    return { status: 302, headers: { location: location.toString() } };
  };

  const token = ({ q, body, authorization }: { q: URLSearchParams; body: unknown; authorization: string | undefined }): Reply => {
    const p = new Map<string, string>(q);
    for (const [k, v] of Object.entries(obj(body))) {
      if (typeof v !== 'string') continue;
      if (p.has(k) && p.get(k) !== v) return oauthError({ status: 400, error: 'invalid_request', description: `${k} differs between query and body` });
      p.set(k, v);
    }
    if (authorization?.startsWith('Basic ') && !p.has('client_id')) {
      const [id, secret] = Buffer.from(authorization.slice(6), 'base64').toString().split(':');
      p.set('client_id', id ?? '');
      p.set('client_secret', secret ?? '');
    }
    const apiKey = p.get('client_id') ?? '';
    const client = clients[apiKey];
    const redirectUri = p.get('redirect_uri');
    const grant = p.get('grant_type');
    if (grant === 'authorization_code') state.counters.authorizationCode++;
    if (grant === 'refresh_token') state.counters.refreshToken++;
    if (!client || client.secret !== p.get('client_secret')) return oauthError({ status: 401, error: 'invalid_client', description: 'Unknown API key or wrong secret' });
    if (grant === 'authorization_code') {
      const code = codes.get(p.get('code') ?? '');
      codes.delete(p.get('code') ?? '');
      if (!code || code.apiKey !== apiKey || code.expiresAt <= now()) return oauthError({ status: 400, error: 'invalid_grant', description: 'Authorization code is invalid, expired or already used' });
      if (!redirectUri) return oauthError({ status: 400, error: 'invalid_request', description: 'redirect_uri is required' });
      if (redirectUri !== code.redirectUri) return oauthError({ status: 400, error: 'invalid_grant', description: 'redirect_uri does not match the authorize request' });
      return tokenReply(issueToken(apiKey));
    }
    if (grant === 'refresh_token') {
      if (!redirectUri) return oauthError({ status: 400, error: options.missingRedirectUriError ?? 'invalid_grant', description: 'redirect_uri is required' });
      if (!client.redirectUris.includes(redirectUri)) return oauthError({ status: 400, error: 'invalid_grant', description: 'redirect_uri does not match the callback URL of the app' });
      const current = state.tokens[apiKey];
      if (!current || current.revoked || current.refreshToken !== p.get('refresh_token')) return oauthError({ status: 400, error: 'invalid_grant', description: 'Refresh token is invalid or was already used' });
      return tokenReply(issueToken(apiKey));
    }
    return oauthError({ status: 400, error: 'unsupported_grant_type', description: `Unsupported grant_type ${grant ?? ''}` });
  };

  const authenticate = (req: IncomingMessage): void => {
    const bearer = /^Bearer\s+(\S+)$/i.exec(header({ req, name: 'authorization' }) ?? '');
    const apiKey = header({ req, name: 'key' });
    if (!bearer) fail({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid or missing authentication token' });
    if (!apiKey || !clients[apiKey]) fail({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid consumer key' });
    const current = state.tokens[apiKey];
    if (!current || current.accessToken !== bearer[1]) fail({ status: 401, code: 'UNAUTHORIZED', message: 'Invalid or missing authentication token' });
    if (current.revoked || current.expiresAt <= now()) fail({ status: 401, code: 'UNAUTHORIZED', message: 'Access token expired' });
  };

  const search = ({ entity, body }: { entity: string; body: Json }): Reply => {
    const items: Json[] = entity === 'case' ? state.cases : state.profiles;
    const filter = body['filter'];
    const q = str(body['q'])?.toLowerCase();
    const timeFilter = obj(body['timeFilter']);
    const timeKey = str(timeFilter['key']);
    const matched = items.filter((item) =>
      (!filter || matches({ item, filter: obj(filter) })) &&
      (!q || [item['subject'], item['description']].some((v) => typeof v === 'string' && v.toLowerCase().includes(q))) &&
      (!timeKey || valuesAt({ value: item, path: timeKey.split('.') }).some((v) => Number(v) >= Number(timeFilter['since'] ?? -Infinity) && Number(v) <= Number(timeFilter['until'] ?? Infinity)))
    );
    const sort = obj(Array.isArray(body['sorts']) ? body['sorts'][0] : undefined);
    const sortKey = str(sort['key']);
    if (sortKey) {
      const dir = str(sort['order'])?.toUpperCase() === 'DESC' ? -1 : 1;
      matched.sort((a, b) => dir * compare({ a: valuesAt({ value: a, path: sortKey.split('.') })[0], b: valuesAt({ value: b, path: sortKey.split('.') })[0] }));
    }
    const page = obj(body['page']);
    const size = Number(page['size'] ?? 20);
    if (!Number.isInteger(size) || size < 1) fail({ status: 400, code: 'INVALID_PARAMETER', message: 'page.size must be a positive integer' });
    return searchPage({ entity, ids: matched.map((i) => String(i['id'])), offset: Number(page['start'] ?? 0), size, expiresAt: 0 });
  };

  const searchPage = (c: { entity: string; ids: string[]; offset: number; size: number; expiresAt: number }): Reply => {
    const items: Json[] = c.entity === 'case' ? state.cases : state.profiles;
    const results = c.ids.slice(c.offset, c.offset + c.size).map((id) => items.find((i) => i['id'] === id)).filter(Boolean);
    const out: Json = { results, count: c.ids.length };
    if (c.offset + c.size < c.ids.length) {
      const id = hex(12);
      cursors.set(id, { ...c, offset: c.offset + c.size, expiresAt: now() + CURSOR_LIFETIME_MS });
      out['cursor'] = options.cursorIdPrefix ? `id=${id}` : id;
    }
    return ok(out);
  };

  const nextSearchPage = ({ entity, q }: { entity: string; q: URLSearchParams }): Reply => {
    const names = cursorParam === 'both' ? ['id', 'cursor'] : [cursorParam];
    const value = names.map((n) => q.get(n)).find((v) => v);
    if (!value) fail({ status: 400, code: 'INVALID_PARAMETER', message: `Required request parameter '${names[0]}' is not present` });
    const c = cursors.get(value);
    if (!c || c.entity !== entity || c.expiresAt <= now()) fail({ status: 400, code: 'INVALID_CURSOR', message: 'Cursor is invalid or expired' });
    return searchPage(c);
  };

  const patchCase = ({ target: c, body, time }: { target: FakeCase; body: Json; time: number }): void => {
    for (const field of ['subject', 'description', 'status', 'priority', 'caseType', 'dueDate', 'summary', 'smartSummary']) {
      if (field in body) c[field] = body[field];
    }
    const wf = obj(body['workflow']);
    const props = c.workflow.customProperties;
    if ('assignment' in wf) c.workflow.assignment = { assignmentTime: time, ...obj(wf['assignment']) };
    if ('syncedCustomProperties' in wf) c.workflow.customProperties = toLists(wf['syncedCustomProperties']);
    Object.assign(c.workflow.customProperties, toLists(wf['syncedSelectedCustomProperties']));
    for (const [k, v] of Object.entries(toLists(wf['addedCustomProperties']))) props[k] = [...new Set([...(props[k] ?? []), ...v])];
    for (const [k, v] of Object.entries(toLists(wf['removedCustomProperties']))) {
      props[k] = (props[k] ?? []).filter((x) => !v.map(String).includes(String(x)));
      if (props[k].length === 0) delete props[k];
    }
    const queueIds = (x: unknown): number[] => (Array.isArray(x) ? x.map(Number) : []);
    if ('syncedQueues' in wf) c.workflow.queues = toQueues({ value: queueIds(wf['syncedQueues']).map((queueId) => ({ queueId })), time });
    for (const queueId of queueIds(wf['addedQueues'])) {
      if (!c.workflow.queues.some((q) => q.queueId === queueId)) c.workflow.queues.push({ queueId, assignmentTime: time });
    }
    const removed = queueIds(wf['removedQueues']);
    c.workflow.queues = c.workflow.queues.filter((q) => !removed.includes(q.queueId));
    c.version += 1;
    c.modifiedTime = time;
  };

  const replaceCase = ({ target: c, body, time }: { target: FakeCase; body: Json; time: number }): void => {
    for (const field of ['subject', 'description', 'status', 'priority', 'caseType', 'dueDate', 'summary', 'smartSummary']) c[field] = body[field];
    const wf = obj(body['workflow']);
    c.workflow = { customProperties: toLists(wf['customProperties']), queues: toQueues({ value: wf['queues'], time }), assignment: wf['assignment'] };
    c.version += 1;
    c.modifiedTime = time;
  };

  const report = (body: Json): Reply => {
    const headingsOf = (x: unknown): string[] => (Array.isArray(x) ? x.map((g) => str(obj(g)['heading'])).filter((h): h is string => !!h) : []);
    let groups = headingsOf(body['groupBys']);
    let metrics = headingsOf(body['projections']);
    if (groups.length + metrics.length === 0) [groups, metrics] = [['Row'], ['Value']];
    const page = Number(body['page'] ?? 0);
    const pageSize = Number(body['pageSize'] ?? 100);
    const end = Math.min(state.reportRowCount, (page + 1) * pageSize);
    const rows: unknown[][] = [];
    for (let i = page * pageSize; i < end; i++) rows.push([...groups.map((h) => `${h} ${i + 1}`), ...metrics.map(() => (i + 1) * 10)]);
    const headings = [...groups, ...metrics];
    const hasMore = end < state.reportRowCount;
    const data = body['jsonResponse'] === true
      ? { data: rows.map((r) => Object.fromEntries(headings.map((h, j) => [h, r[j]]))), hasMore }
      : { headings, rows, hasMore };
    return { status: 200, body: { data, errors: [], metadata: {} } };
  };

  const webhooks = async ({ method, path, q, body }: { method: string; path: string; q: URLSearchParams; body: Json }): Promise<Reply> => {
    const subscriptionId = q.get('subscriptionId');
    const sub = state.subscriptions.find((s) => s.id === subscriptionId);
    if (method === 'POST' && path === '/webhook-subscriptions') {
      const types = Array.isArray(body['subscriptions'])
        ? body['subscriptions'].map(String)
        : (Array.isArray(body['filteredSubscriptions']) ? body['filteredSubscriptions'] : []).map((f) => String(obj(f)['webhookType']));
      if (!str(body['name']) || !str(body['url']) || !str(body['preSharedKey']) || types.length === 0) {
        fail({ status: 400, code: 'VALIDATION_ERROR', message: 'name, url, preSharedKey and subscriptions are required' });
      }
      const created: FakeSubscription = { id: hex(12), name: String(body['name']), url: String(body['url']), preSharedKey: String(body['preSharedKey']), subscriptions: types, verified: false, active: false };
      state.subscriptions.push(created);
      return okCreated(present(created));
    }
    if (method === 'GET' && path === '/webhook-subscriptions') {
      return ok(state.subscriptions.filter((s) => !subscriptionId || subscriptionId.split(',').includes(s.id)).map(present));
    }
    if (!sub) fail({ status: 404, code: 'NOT_FOUND', message: 'webhook.subscription.not.found' });
    if (method === 'DELETE' && path === '/webhook-subscriptions') {
      state.subscriptions = state.subscriptions.filter((s) => s !== sub);
      return ok(true);
    }
    if (method === 'PUT' && path === '/webhook-subscriptions') {
      if (Array.isArray(body['subscriptions'])) sub.subscriptions = body['subscriptions'].map(String);
      if (str(body['name'])) sub.name = String(body['name']);
      return ok(present(sub));
    }
    if (method === 'POST' && path === '/webhook-subscriptions/action') {
      const action = q.get('action');
      if (action === 'verify') {
        const status = await deliver({ url: sub.url, body: '{}', headers: {} });
        state.deliveries.push({ subscriptionId: sub.id, url: sub.url, kind: 'verify', body: '{}', status });
        sub.verified = status >= 200 && status < 300;
        return ok(sub.verified);
      }
      if (action === 'activate') {
        if (!sub.verified) fail({ status: 400, code: 'VALIDATION_ERROR', message: 'webhook.subscription.not.verified' });
        sub.active = true;
        return ok(true);
      }
      if (action === 'deactivate') {
        sub.active = false;
        return ok(true);
      }
      fail({ status: 400, code: 'INVALID_PARAMETER', message: `Unknown action ${action ?? ''}` });
    }
    return notFound(path);
  };

  const api = async ({ req, version, path, q, body }: { req: IncomingMessage; version: string; path: string; q: URLSearchParams; body: Json }): Promise<Reply> => {
    const method = req.method ?? 'GET';
    const time = now();
    if (path === '/me' && method === 'GET') return version === 'v2' ? { status: 200, body: user } : ok(envelope === 'wrapped' ? [user] : user);
    if (version !== 'v3') return notFound(path);
    if (path === '/case') {
      if (method === 'GET') {
        if (!q.get('id') && !q.get('caseNumber')) fail({ status: 400, code: 'INVALID_PARAMETER', message: 'id or caseNumber is required' });
        const found = findCase(q);
        return ok(found ? [found] : []);
      }
      if (method === 'POST') {
        const channelType = str(body['channelType']);
        const contactInfo = body['contactInfo'];
        if (!channelType) fail({ status: 400, code: 'VALIDATION_ERROR', message: 'channelType is required' });
        if (!contactInfo || typeof contactInfo !== 'object') fail({ status: 400, code: 'VALIDATION_ERROR', message: 'contactInfo is required' });
        if (channelType !== channelType.toUpperCase()) fail({ status: 400, code: 'VALIDATION_ERROR', message: `Unknown channelType ${channelType}` });
        if (channelType === 'EMAIL' && !str(obj(contactInfo)['email'])) fail({ status: 400, code: 'VALIDATION_ERROR', message: 'contactInfo.email is required for EMAIL' });
        if (channelType === 'SMS' && !str(obj(contactInfo)['phoneNo'])) fail({ status: 400, code: 'VALIDATION_ERROR', message: 'contactInfo.phoneNo is required for SMS' });
        if (!['EMAIL', 'SMS'].includes(channelType) && !str(body['channelId'])) fail({ status: 400, code: 'VALIDATION_ERROR', message: 'channelId is required' });
        const created = createCase({ input: body, time });
        if (options.autoEmitEvents) void emitCaseEvent({ type: 'case.create', target: created }).catch(() => undefined);
        return okCreated(created);
      }
      if (method === 'PATCH' || method === 'PUT') {
        const target = findCase(q) ?? (method === 'PUT' ? findCase(body) : undefined);
        if (!target) fail({ status: 404, code: 'NOT_FOUND', message: 'case.not.found' });
        if (method === 'PUT') {
          replaceCase({ target, body, time });
          return ok(target);
        }
        patchCase({ target, body, time });
        if (options.autoEmitEvents) void emitCaseEvent({ type: 'case.update', target }).catch(() => undefined);
        return { status: 204 };
      }
    }
    if (path === '/comment') {
      if (method === 'GET') return ok(state.comments.filter((c) => c['entityId'] === q.get('entityId')));
      if (method === 'POST') {
        if (body['entityType'] !== 'CASE') fail({ status: 400, code: 'VALIDATION_ERROR', message: 'entityType must be CASE' });
        if (typeof body['entityId'] !== 'string') fail({ status: 400, code: 'VALIDATION_ERROR', message: 'entityId must be a string' });
        if (!str(body['text'])) fail({ status: 400, code: 'VALIDATION_ERROR', message: 'text is required' });
        if (!state.cases.some((c) => String(c.caseNumber) === body['entityId'])) fail({ status: 404, code: 'NOT_FOUND', message: 'case.not.found' });
        return ok(addComment({ entityId: String(body['entityId']), text: String(body['text']), isPrivate: body['isPrivate'] === true, time }));
      }
    }
    if (path === '/profile' && method === 'GET') {
      const id = q.get('id');
      const [channelType, ...rest] = (q.get('channelTypeChannelId') ?? '').split('~');
      const channelId = rest.join('~');
      if (!id && !channelId) fail({ status: 400, code: 'INVALID_PARAMETER', message: 'id or channelTypeChannelId is required' });
      return ok(state.profiles.filter((p) => (id ? p.id === id : p.profiles.some((s) => s.channelType === channelType && s.channelId === channelId))));
    }
    const searchMatch = /^\/search\/([A-Za-z]+)$/.exec(path);
    if (searchMatch) {
      const entity = searchMatch[1].toLowerCase();
      if (entity !== 'case' && entity !== 'profile') fail({ status: 400, code: 'INVALID_PARAMETER', message: `Unsupported entity ${searchMatch[1]}` });
      if (method === 'POST') return search({ entity, body });
      if (method === 'GET') return nextSearchPage({ entity, q });
    }
    if (path === '/reports/query' && method === 'POST') return report(body);
    if (path.startsWith('/webhook-subscriptions')) return webhooks({ method, path, q, body });
    return notFound(path);
  };

  const route = async ({ req, url, raw }: { req: IncomingMessage; url: URL; raw: string }): Promise<Reply> => {
    let path = url.pathname;
    if (segment) {
      if (path !== `/${segment}` && !path.startsWith(`/${segment}/`)) return notFound(path);
      path = path.slice(segment.length + 1) || '/';
    }
    const method = req.method ?? 'GET';
    if (path === '/oauth/authorize' && method === 'GET') return authorize(url.searchParams);
    let body: unknown;
    if (raw) {
      const type = header({ req, name: 'content-type' }) ?? '';
      if (type.includes('application/x-www-form-urlencoded')) body = Object.fromEntries(new URLSearchParams(raw));
      else {
        try {
          body = JSON.parse(raw);
        } catch {
          fail({ status: 400, code: 'INVALID_PARAMETER', message: 'Malformed JSON body' });
        }
      }
    }
    if (path === '/oauth/token' && method === 'POST') {
      const reply = token({ q: url.searchParams, body, authorization: header({ req, name: 'authorization' }) });
      if (reply.status !== 200) state.counters.tokenErrors++;
      return reply;
    }
    const apiMatch = /^\/api\/(v2|v3)(\/.*)$/.exec(path);
    if (!apiMatch) return notFound(path);
    const failure = failures.shift();
    if (failure) return failureReply(failure);
    authenticate(req);
    return api({ req, version: apiMatch[1], path: apiMatch[2], q: url.searchParams, body: obj(body) });
  };

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const url = new URL(req.url ?? '/', 'http://fake-sprinklr');
      route({ req, url, raw })
        .catch((e: unknown) => (e instanceof FakeFailure ? e.reply : htmlReply({ status: 500, text: String(e) })))
        .then((reply) => {
          const entry: FakeSprinklrRequest = { method: req.method ?? 'GET', path: req.url ?? '/', status: reply.status, headers: req.headers, body: raw };
          state.requests.push(entry);
          options.onRequest?.(entry);
          const payload = reply.html ?? (reply.body === undefined ? '' : JSON.stringify(reply.body));
          const contentType = reply.html !== undefined ? 'text/html; charset=utf-8' : 'application/json';
          res.writeHead(reply.status, { ...(payload ? { 'content-type': contentType } : {}), ...reply.headers });
          res.end(payload);
        });
    });
  });

  await new Promise<void>((resolve) => server.listen(options.port ?? 0, options.host ?? '127.0.0.1', resolve));
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('The fake Sprinklr server has no TCP address');
  const port = address.port;
  const origin = `http://${options.host ?? '127.0.0.1'}:${port}`;
  return {
    origin,
    baseUrl: segment ? `${origin}/${segment}` : origin,
    port,
    state,
    control: {
      failNext: (n, kind) => {
        for (let i = 0; i < n; i++) failures.push(kind);
      },
      expireAccessTokens: () => {
        for (const t of Object.values(state.tokens)) t.revoked = true;
      },
      issueToken: (apiKey = FAKE_SPRINKLR_CLIENT.apiKey) => issueToken(apiKey),
      seedCases: (n, overrides) => {
        const time = now();
        return Array.from({ length: n }, (_, i) => {
          const seeded = createCase({ input: { subject: `Seeded case ${i + 1}`, description: `Seeded description ${i + 1}`, channelType: 'EMAIL', contactInfo: { email: `customer${i + 1}@example.com`, fullName: `Customer ${i + 1}` }, priority: 'Medium' }, time: time - (n - 1 - i) * 60000 });
          Object.assign(seeded, overrides?.(i, seeded) ?? {});
          return seeded;
        });
      },
      advanceTime: (ms) => {
        offset += ms;
      },
      emitCaseEvent,
    },
    close: () => new Promise<void>((resolve) => {
      server.closeAllConnections();
      server.close(() => resolve());
    }),
  };
}

const CODE_LIFETIME_MS = 10 * 60 * 1000;
const CURSOR_LIFETIME_MS = 5 * 60 * 1000;

function matches({ item, filter }: { item: unknown; filter: Json }): boolean {
  const type = String(filter['type'] ?? '').toUpperCase();
  const subs = (Array.isArray(filter['filters']) ? filter['filters'] : []).map(obj);
  if (type === 'AND') return subs.every((f) => matches({ item, filter: f }));
  if (type === 'OR') return subs.some((f) => matches({ item, filter: f }));
  if (type === 'NOT') return !subs.every((f) => matches({ item, filter: f }));
  const actual = valuesAt({ value: item, path: String(filter['key'] ?? '').split('.') }).map(String);
  const wanted = (Array.isArray(filter['values']) ? filter['values'] : []).map(String);
  const numeric = (test: (a: number, b: number) => boolean): boolean => actual.some((a) => test(Number(a), Number(wanted[0])));
  switch (type) {
    case 'IN':
    case 'EQUALS':
      return actual.some((a) => wanted.includes(a));
    case 'NIN':
    case 'NOT_EQUALS':
      return !actual.some((a) => wanted.includes(a));
    case 'CONTAINS':
      return actual.some((a) => wanted.some((w) => a.toLowerCase().includes(w.toLowerCase())));
    case 'GT':
      return numeric((a, b) => a > b);
    case 'GTE':
      return numeric((a, b) => a >= b);
    case 'LT':
      return numeric((a, b) => a < b);
    case 'LTE':
      return numeric((a, b) => a <= b);
    default:
      return fail({ status: 400, code: 'INVALID_PARAMETER', message: `Unsupported filter type ${type}` });
  }
}

function valuesAt({ value, path }: { value: unknown; path: string[] }): unknown[] {
  if (Array.isArray(value)) return value.flatMap((v) => valuesAt({ value: v, path }));
  if (path.length === 0) return value === undefined || value === null ? [] : [value];
  if (value && typeof value === 'object') return valuesAt({ value: obj(value)[path[0]], path: path.slice(1) });
  return [];
}

function compare({ a, b }: { a: unknown; b: unknown }): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''));
}

function toLists(value: unknown): Record<string, unknown[]> {
  return Object.fromEntries(Object.entries(obj(value)).map(([k, v]) => [k, Array.isArray(v) ? v : [v]]));
}

function toQueues({ value, time }: { value: unknown; time: number }): { queueId: number; assignmentTime: number }[] {
  return (Array.isArray(value) ? value : []).map((q) => ({ queueId: Number(obj(q)['queueId']), assignmentTime: Number(obj(q)['assignmentTime'] ?? time) }));
}

function present(s: FakeSubscription): Json {
  return { ...s, filteredSubscriptions: s.subscriptions.map((webhookType) => ({ webhookType })), viaProxy: false };
}

async function deliver({ url, body, headers }: { url: string; body: string; headers: Record<string, string> }): Promise<number> {
  try {
    const res = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json', ...headers }, signal: AbortSignal.timeout(10000) });
    await res.arrayBuffer();
    return res.status;
  } catch {
    return 0;
  }
}

function failureReply(kind: FakeSprinklrFailure): Reply {
  const mashery = ({ code, text }: { code: string; text: string }): Reply => ({ status: 403, html: `<h1>${text}</h1>`, headers: { 'x-mashery-error-code': code } });
  switch (kind) {
    case '429':
      return { status: 429, body: { errors: [{ id: randomUUID(), code: 'RATE_LIMIT_EXCEEDED', message: 'Too Many Requests' }] }, headers: { 'retry-after': '1' } };
    case '403-developer-over-rate':
      return mashery({ code: 'ERR_403_DEVELOPER_OVER_RATE', text: 'Developer Over Rate' });
    case '403-account-qps':
      return mashery({ code: 'ERR_403_ACCOUNT_OVER_QPS', text: 'Account Over Queries Per Second Limit' });
    case '403-account-rate':
      return mashery({ code: 'ERR_403_ACCOUNT_OVER_RATE', text: 'Account Over Rate Limit' });
    case '500-html':
      return htmlReply({ status: 500, text: 'Service Unavailable' });
  }
}

class FakeFailure extends Error {
  constructor(readonly reply: Reply) {
    super(`fake sprinklr ${reply.status}`);
  }
}

function fail({ status, code, message }: { status: number; code: string; message: string }): never {
  throw new FakeFailure({ status, body: { errors: [{ id: randomUUID(), code, message }] } });
}

function notFound(path: string): Reply {
  return { status: 404, body: { message: `Path ${path} not found` } };
}

function htmlReply({ status, text }: { status: number; text: string }): Reply {
  return { status, html: `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8" /><title>${text}</title></head><body><h1>${text}</h1></body></html>` };
}

function oauthError({ status, error, description }: { status: number; error: string; description: string }): Reply {
  return { status, body: { error, error_description: description } };
}

function tokenReply(t: FakeToken): Reply {
  return { status: 200, body: { access_token: t.accessToken, refresh_token: t.refreshToken, token_type: 'Bearer', expires_in: t.expiresIn } };
}

function header({ req, name }: { req: IncomingMessage; name: string }): string | undefined {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function obj(value: unknown): Json {
  return isJson(value) ? value : {};
}

function isJson(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | undefined {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function hex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

type Json = Record<string, unknown>;

type Reply = { status: number; body?: unknown; html?: string; headers?: Record<string, string> };

export type FakeSprinklrFailure = '429' | '403-developer-over-rate' | '403-account-qps' | '403-account-rate' | '500-html';

export type FakeCaseEventType = 'case.create' | 'case.update' | 'case.delete';

export type FakeCaseEvent = { type: FakeCaseEventType; target: FakeCase | number };

export type FakeSprinklrOptions = {
  port?: number;
  host?: string;
  envelope?: 'wrapped' | 'bare';
  segment?: string;
  clients?: Record<string, { secret: string; redirectUris: string[] }>;
  now?: () => number;
  tokenTtlSeconds?: number;
  cursorParam?: 'id' | 'cursor' | 'both';
  cursorIdPrefix?: boolean;
  missingRedirectUriError?: 'invalid_grant' | 'invalid_request';
  autoEmitEvents?: boolean;
  user?: Json;
  onRequest?: (entry: FakeSprinklrRequest) => void;
};

export type FakeToken = { apiKey: string; accessToken: string; refreshToken: string; expiresAt: number; expiresIn: number; revoked: boolean };

export type FakeCase = Json & {
  id: string;
  caseNumber: number;
  version: number;
  createdTime: number;
  modifiedTime: number;
  workflow: { customProperties: Record<string, unknown[]>; queues: { queueId: number; assignmentTime: number }[]; assignment?: unknown };
};

export type FakeProfile = Json & {
  id: string;
  contact: Json;
  profiles: { channelType: string; channelId: string; username: string; name: string }[];
  createdTime: number;
  modifiedTime: number;
};

export type FakeSubscription = { id: string; name: string; url: string; preSharedKey: string; subscriptions: string[]; verified: boolean; active: boolean };

export type FakeSprinklrRequest = { method: string; path: string; status: number; headers: IncomingMessage['headers']; body: string };

export type FakeSprinklrState = {
  cases: FakeCase[];
  profiles: FakeProfile[];
  comments: Json[];
  subscriptions: FakeSubscription[];
  tokens: Record<string, FakeToken>;
  counters: { authorize: number; authorizationCode: number; refreshToken: number; tokenErrors: number };
  requests: FakeSprinklrRequest[];
  deliveries: { subscriptionId: string; url: string; kind: 'verify' | 'event'; body: string; signature?: string; status: number }[];
  reportRowCount: number;
};

export type FakeSprinklr = {
  origin: string;
  baseUrl: string;
  port: number;
  state: FakeSprinklrState;
  control: {
    failNext: (n: number, kind: FakeSprinklrFailure) => void;
    expireAccessTokens: () => void;
    issueToken: (apiKey?: string) => FakeToken;
    seedCases: (n: number, overrides?: (index: number, seeded: FakeCase) => Json) => FakeCase[];
    advanceTime: (ms: number) => void;
    emitCaseEvent: (event: FakeCaseEvent) => Promise<{ subscriptionId: string; status: number }[]>;
  };
  close: () => Promise<void>;
};
