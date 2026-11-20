/**
 * Every action, dropdown, trigger and the auth check of the SyncMate piece,
 * run end to end over real HTTP against a local stand-in for SyncMate's
 * Cloudflare gateway (https://api.assistro.co). The stub answers the way the
 * gateway and Assistro do (envelopes, 401/404/422/429 bodies) and records
 * every request, so each test asserts the exact path, headers and body the
 * piece sends. Nothing leaves this machine and no WhatsApp message is sent.
 */
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ApFile } from '@activepieces/pieces-framework';
import { syncmate } from '../src/index';
import { syncmateAuth } from '../src/lib/auth';
import { syncmateProps } from '../src/lib/common/props';
import { signEvent } from '../src/lib/common/signature';
import { metaSendTemplateAction } from '../src/lib/actions/meta-actions';

type Recorded = {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: IncomingMessage['headers'];
  body: any;
};

const requests: Recorded[] = [];
let server: Server;
let baseUrl = '';

const QUEUED = (job = 'job-1') => ({
  success: true,
  status: 1,
  message: 'Queued',
  job_id: job,
  status_url: `${baseUrl}/gateway/jobs/${job}`,
});

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json') {
  res.writeHead(status, { 'content-type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

/** Stand-in for the gateway: same routes, same refusals. */
function handle(req: IncomingMessage, res: ServerResponse, raw: string) {
  const url = new URL(req.url ?? '/', 'http://stub');
  const path = url.pathname;
  const key = String(req.headers['authorization'] ?? '').replace(/^Bearer\s+/i, '');
  const body = raw ? JSON.parse(raw) : undefined;
  requests.push({ method: req.method ?? '', path, query: Object.fromEntries(url.searchParams), headers: req.headers, body });

  if (path === '/files/invoice.pdf') return send(res, 200, Buffer.from('%PDF-1.4 test invoice'), 'application/pdf');
  if (path === '/files/missing.pdf') return send(res, 404, 'nope', 'text/plain');

  if (!key) return send(res, 401, { message: 'Unauthorized' });
  if (key === 'expired') {
    return send(res, 401, { success: false, status: 0, message: 'Access token has expired.', reason: 'token_expired' });
  }
  if (key === 'revoked') {
    return send(res, 401, { success: false, status: 0, message: 'Invalid or revoked token', reason: 'invalid_token' });
  }
  if (key === 'limited' && req.method === 'POST') {
    return send(res, 429, { success: false, status: 0, message: 'Monthly message limit reached', reason: 'monthly_limit', resets_at: '2026-12-01T00:00:00Z' });
  }
  if (key === 'noaddon' && req.method === 'POST') {
    return send(res, 403, { success: false, status: 0, message: 'Activepieces is not active on your plan' });
  }

  const route = `${req.method} ${path}`;
  switch (route) {
    case 'GET /v1/me':
      return send(res, 200, { success: true, data: { id: 7 } });
    case 'POST /v1/message': {
      const msgs = body?.msgs;
      if (!Array.isArray(msgs) || msgs.length === 0) return send(res, 422, { message: 'The msgs field is required.', errors: { msgs: ['The msgs field is required.'] } });
      const bad = msgs.findIndex((m: any) => !m.number);
      if (bad >= 0) return send(res, 422, { message: 'The number field is required for each message.', errors: { [`msgs.${bad}.number`]: ['The number field is required for each message.'] } });
      return send(res, 200, QUEUED());
    }
    case 'POST /v1/meta/messages/text':
    case 'POST /v1/meta/messages/template':
    case 'POST /v1/meta/messages/media':
      return send(res, 200, QUEUED('job-meta'));
    case 'GET /v1/meta/templates':
      return send(res, 200, {
        success: true,
        data: {
          templates: [
            { name: 'order_update', language: 'en', status: 'APPROVED', category: 'UTILITY' },
            { name: 'order_update', language: 'hi', status: 'APPROVED', category: 'UTILITY' },
            { name: 'welcome', language: 'en', status: 'PENDING', category: 'MARKETING' },
          ],
        },
      });
    case 'GET /v1/meta/messages/template-schema':
      return url.searchParams.get('template') === 'order_update'
        ? send(res, 200, { type: 'object', properties: { var2: { type: 'string' }, var1: { type: 'string' } } })
        : send(res, 404, { message: 'Template not found' });
    case 'GET /groups':
      return send(res, 200, {
        success: true,
        data: {
          'groups ': [],
          groups: [
            { id: { _serialized: '120363001@g.us' }, subject: 'Team Sales' },
            { id: '120363002@g.us', name: 'Alpha Buyers' },
          ],
        },
      });
    case 'GET /channels':
      return send(res, 200, { success: true, data: { channels: [{ id: '120363555@newsletter', name: 'Offers' }] } });
    case 'GET /v1/whatsapp/connection':
      return key === 'offline'
        ? send(res, 404, { success: false, message: 'Not connected', data: { isConnected: 0 } })
        : send(res, 200, { success: true, data: { isConnected: 1 } });
    case 'GET /gateway/jobs/job-1':
      return send(res, 200, {
        success: true,
        status: 1,
        job: { job_id: 'job-1', status: 'delivered', upstream_status: 200, upstream_body: '{"success":true,"message":"Message sent"}' },
      });
    case 'GET /v1/activepieces/events/connections':
      return send(res, 200, {
        success: true,
        status: 1,
        data: [
          { id: 93, name: 'Sales (+919928044051)', number: '919928044051', mode: 'standard', connected: true },
          { id: 94, name: 'Support', number: null, mode: 'meta', connected: false },
        ],
      });
    case 'POST /v1/activepieces/events/subscriptions':
      return send(res, 201, { success: true, status: 1, data: { id: '6704f0aa00000000000000a1', event: body?.event, platform: 'activepieces', secret: 'whsec-test' } });
    case 'DELETE /v1/activepieces/events/subscriptions/6704f0aa00000000000000a1':
      return send(res, 200, { success: true, status: 1, data: { id: '6704f0aa00000000000000a1', deleted: true } });
    case 'GET /v1/activepieces/events/sample':
      return send(res, 200, {
        success: true,
        status: 1,
        data: url.searchParams.get('connection_id') === '94' ? [] : [{ id: 'evt-real', event: url.searchParams.get('event') }],
      });
  }
  if (route === 'POST /v1/activepieces/hooks') {
    if (!['contact', 'task', 'deal', 'note', 'ticket'].includes(body?.type)) {
      return send(res, 422, { success: false, status: 0, message: 'type must be one of: contact, task, deal, note, ticket' });
    }
    return send(res, 201, { success: true, status: 1, data: { id: 501, type: body.type, platform: 'activepieces', secret: 'rec-secret' } });
  }
  if (route === 'DELETE /v1/activepieces/hooks/501') return send(res, 200, { success: true, status: 1, data: { id: 501, deleted: true } });
  if (route === 'GET /v1/activepieces/hooks/sample') {
    return send(res, 200, { success: true, status: 1, data: [{ sampleFor: url.searchParams.get('type') }] });
  }
  if (path.startsWith('/v1/activepieces/hooks/')) return send(res, 404, { success: false, status: 0, message: 'Hook not found.' });
  if (path.startsWith('/gateway/jobs/')) return send(res, 404, { success: false, status: 0, message: 'Job not found' });
  if (path.startsWith('/v1/activepieces/events/subscriptions/')) return send(res, 404, { success: false, status: 0, message: 'Subscription not found.' });
  return send(res, 404, { success: false, status: 0, message: 'Not found' });
}

const authFor = (apiKey = 'good') => ({ type: 'CUSTOM_AUTH', props: { apiKey, baseUrl } });
const last = () => requests[requests.length - 1];
const action = (name: string) => syncmate.getAction(name) as any;
const trigger = (name: string) => syncmate.getTrigger(name) as any;
const runAction = (name: string, propsValue: Record<string, unknown>, apiKey = 'good') =>
  action(name).run({ auth: authFor(apiKey), propsValue });

function expectGatewayHeaders(r: Recorded, apiKey = 'good') {
  expect(r.headers['authorization']).toBe(`Bearer ${apiKey}`);
  expect(r.headers['integration']).toBe('activepieces');
}

beforeAll(async () => {
  server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => handle(req, res, Buffer.concat(chunks).toString('utf8')));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(() => {
  requests.length = 0;
});

describe('piece definition', () => {
  it('registers 13 actions and 3 webhook triggers', () => {
    expect(Object.keys(syncmate.actions()).sort()).toEqual(
      [
        'channelSend',
        'checkConnection',
        'custom_api_call',
        'getSendStatus',
        'groupSend',
        'listChannels',
        'listGroups',
        'metaListTemplates',
        'metaSendMedia',
        'metaSendTemplate',
        'metaSendText',
        'sendBulkMessage',
        'sendMessage',
      ].sort()
    );
    expect(Object.keys(syncmate.triggers()).sort()).toEqual(
      [
        'messageStatusUpdated',
        'newMessageReceived',
        'newOutgoingMessage',
      ].sort()
    );
    for (const t of Object.values(syncmate.triggers())) {
      expect((t as any).type).toBe('WEBHOOK');
    }
  });

  it('keeps the v0.0.5 action and prop names, so existing flows map over', () => {
    expect(Object.keys(action('sendMessage').props)).toEqual(expect.arrayContaining(['number', 'message', 'media']));
    expect(Object.keys(action('groupSend').props)).toEqual(expect.arrayContaining(['number', 'message', 'media']));
    expect(Object.keys(action('channelSend').props)).toEqual(expect.arrayContaining(['number', 'message']));
  });
});

describe('connection (auth validate)', () => {
  const validate = (apiKey: string) => (syncmateAuth as any).validate({ auth: { apiKey, baseUrl }, server: {} });

  it('accepts a working key via GET /v1/me', async () => {
    await expect(validate('good')).resolves.toEqual({ valid: true });
    expect(last().method).toBe('GET');
    expect(last().path).toBe('/v1/me');
    expectGatewayHeaders(last());
  });

  it('explains an expired or revoked key', async () => {
    await expect(validate('expired')).resolves.toMatchObject({ valid: false, error: expect.stringContaining('expired') });
    await expect(validate('revoked')).resolves.toMatchObject({ valid: false, error: expect.stringContaining('invalid or was revoked') });
  });
});

describe('standard sends (POST /v1/message)', () => {
  it('sends a text to a contact', async () => {
    const out = await runAction('sendMessage', { number: '+91 98765 43210', message: 'Your order shipped' });

    expect(out).toMatchObject({ message: 'Queued', job_id: 'job-1' });
    expect(last().method).toBe('POST');
    expect(last().path).toBe('/v1/message');
    expectGatewayHeaders(last());
    expect(last().body).toEqual({ msgs: [{ number: '+919876543210', message: 'Your order shipped', type: 1 }] });
  });

  it('sends a file from an earlier step, a downloaded URL and base64 rows together', async () => {
    await runAction('sendMessage', {
      number: '+919876543210',
      message: 'Invoice attached',
      file: new ApFile('photo.png', Buffer.from('PNGDATA'), 'png'),
      fileUrl: `${baseUrl}/files/invoice.pdf`,
      media: [{ media_base64: 'data:text/plain;base64,SGVsbG8=', file_name: 'note.txt' }],
    });

    const send = requests.find((r) => r.path === '/v1/message')!;
    expect(requests.some((r) => r.path === '/files/invoice.pdf')).toBe(true);
    expect(send.body.msgs[0].media).toEqual([
      { media_base64: Buffer.from('PNGDATA').toString('base64'), file_name: 'photo.png' },
      { media_base64: Buffer.from('%PDF-1.4 test invoice').toString('base64'), file_name: 'invoice.pdf' },
      { media_base64: 'SGVsbG8=', file_name: 'note.txt' },
    ]);
  });

  it('uses the File Name prop for the attachment name', async () => {
    await runAction('sendMessage', {
      number: '1',
      message: '',
      file: new ApFile('upload.bin', Buffer.from('x'), 'bin'),
      fileName: 'Receipt.pdf',
    });
    expect(last().body.msgs[0]).toMatchObject({ message: '', media: [{ file_name: 'Receipt.pdf' }] });
  });

  it('fails clearly when the File URL cannot be downloaded, without sending', async () => {
    await expect(runAction('sendMessage', { number: '1', message: 'x', fileUrl: `${baseUrl}/files/missing.pdf` })).rejects.toThrow(
      'Could not download the file'
    );
    expect(requests.some((r) => r.path === '/v1/message')).toBe(false);
  });

  it('refuses an empty message with no attachment before calling SyncMate', async () => {
    await expect(runAction('sendMessage', { number: '1', message: '   ' })).rejects.toThrow('Enter a message or add an attachment');
    expect(requests).toHaveLength(0);
  });

  it('sends to a group picked from the dropdown', async () => {
    await runAction('groupSend', { group: '120363001@g.us', number: '', message: 'Standup in 5' });
    expect(last().body).toEqual({ msgs: [{ number: '120363001@g.us', message: 'Standup in 5', type: 2 }] });
  });

  it('sends to a typed Group ID, adding @g.us', async () => {
    await runAction('groupSend', { number: '120363777', message: 'Hi team' });
    expect(last().body.msgs[0]).toMatchObject({ number: '120363777@g.us', type: 2 });
  });

  it('asks for a group when neither is given', async () => {
    await expect(runAction('groupSend', { message: 'x' })).rejects.toThrow('group');
  });

  it('posts to a channel (picked or typed), adding @newsletter', async () => {
    await runAction('channelSend', { channel: '120363555@newsletter', message: 'New offers' });
    expect(last().body).toEqual({ msgs: [{ number: '120363555@newsletter', message: 'New offers', type: 3 }] });
    await runAction('channelSend', { number: '120363556', message: 'More offers' });
    expect(last().body.msgs[0].number).toBe('120363556@newsletter');
  });

  it('sends one message to many numbers with a time gap', async () => {
    await runAction('sendBulkMessage', { numbers: ['+91 1111', '+912222, +911111'], message: 'Sale!', timeGap: 10 });
    expect(last().path).toBe('/v1/message');
    expect(last().body).toEqual({
      msgs: [
        { number: '+911111', message: 'Sale!', type: 1 },
        { number: '+912222', message: 'Sale!', type: 1 },
      ],
      time_gap: 10,
    });
  });

  it('reports the gateway\'s refusals in plain words', async () => {
    await expect(runAction('sendMessage', { number: '1', message: 'x' }, 'expired')).rejects.toThrow('expired');
    await expect(runAction('sendMessage', { number: '1', message: 'x' }, 'limited')).rejects.toThrow(
      'Monthly message limit reached. Resets at 2026-12-01T00:00:00Z.'
    );
    await expect(runAction('sendMessage', { number: '1', message: 'x' }, 'noaddon')).rejects.toThrow(
      'Activepieces is not active on your plan'
    );
  });

  it('refuses an attachment set over the 5 MB gateway limit before sending', async () => {
    await expect(
      runAction('sendMessage', { number: '1', message: 'x', file: new ApFile('big.bin', Buffer.alloc(4 * 1024 * 1024), 'bin') })
    ).rejects.toThrow('over the 5 MB');
    expect(requests).toHaveLength(0);
  });
});

describe('Meta Cloud API actions', () => {
  it('sends text', async () => {
    const out = await runAction('metaSendText', { to: '+91 98765 43210', text: 'Hello' });
    expect(out).toMatchObject({ job_id: 'job-meta' });
    expect(last().path).toBe('/v1/meta/messages/text');
    expectGatewayHeaders(last());
    expect(last().body).toEqual({ to: '+919876543210', type: 'text', body: 'Hello' });
  });

  it('sends a template with variables and a header image', async () => {
    await runAction('metaSendTemplate', {
      to: '+919876543210',
      template: 'order_update',
      language: 'en',
      variables: { '1': 'Asha', '2': '#1001' },
      headerMediaType: 'image',
      headerMediaUrl: 'https://cdn.example.com/banner.png',
    });
    expect(last().path).toBe('/v1/meta/messages/template');
    expect(last().body).toEqual({
      to: '+919876543210',
      type: 'template',
      template_name: 'order_update',
      language: 'en',
      template_params: { '1': 'Asha', '2': '#1001' },
      header_media_url: 'https://cdn.example.com/banner.png',
      header_media_type: 'image',
    });
  });

  it('sends a template header from a file as base64', async () => {
    await runAction('metaSendTemplate', {
      to: '1',
      template: 'order_update',
      language: 'en',
      variables: { '1': 'Asha' },
      headerMediaType: 'document',
      headerFile: new ApFile('terms.pdf', Buffer.from('%PDF-1.4 terms'), 'pdf'),
    });
    expect(last().body).toMatchObject({
      template_params: { '1': 'Asha' },
      header_media_base64: Buffer.from('%PDF-1.4 terms').toString('base64'),
      header_media_filename: 'terms.pdf',
      header_media_type: 'document',
    });
    expect(last().body).not.toHaveProperty('header_media_url');
  });

  it('sends Meta media from a file as base64, or refuses when neither file nor URL is given', async () => {
    await runAction('metaSendMedia', {
      to: '1',
      mediaType: 'document',
      file: new ApFile('invoice.pdf', Buffer.from('%PDF-1.4 invoice'), 'pdf'),
      caption: 'Invoice',
    });
    expect(last().path).toBe('/v1/meta/messages/media');
    expect(last().body).toEqual({
      to: '1',
      media_type: 'document',
      media_base64: Buffer.from('%PDF-1.4 invoice').toString('base64'),
      media_filename: 'invoice.pdf',
      caption: 'Invoice',
    });

    requests.length = 0;
    await expect(runAction('metaSendMedia', { to: '1', mediaType: 'image', caption: 'x' })).rejects.toThrow('Add a file or enter a Media URL');
    expect(requests).toHaveLength(0);
  });

  it('sends media by URL for each media type', async () => {
    for (const mediaType of ['image', 'video', 'audio', 'document']) {
      await runAction('metaSendMedia', {
        to: '1',
        mediaType,
        mediaUrl: 'https://cdn.example.com/f',
        caption: 'Cap',
        fileName: 'f.pdf',
      });
      expect(last().path).toBe('/v1/meta/messages/media');
      expect(last().body.media_type).toBe(mediaType);
      expect('caption' in last().body).toBe(mediaType !== 'audio');
      expect('media_filename' in last().body).toBe(mediaType === 'document');
    }
  });

  it('lists templates with a status filter and a clamped limit', async () => {
    const out = await runAction('metaListTemplates', { status: 'APPROVED', limit: 500 });
    expect(last().method).toBe('GET');
    expect(last().query).toEqual({ limit: '100', status: 'APPROVED' });
    expect(out).toMatchObject({ data: { templates: expect.any(Array) } });

    await runAction('metaListTemplates', { status: 'all' });
    expect(last().query).toEqual({ limit: '50' });
  });
});

describe('utility actions', () => {
  it('lists groups and channels with clean ids', async () => {
    await expect(runAction('listGroups', {})).resolves.toEqual({
      groups: [
        { id: '120363002@g.us', name: 'Alpha Buyers' },
        { id: '120363001@g.us', name: 'Team Sales' },
      ],
    });
    await expect(runAction('listChannels', {})).resolves.toEqual({ channels: [{ id: '120363555@newsletter', name: 'Offers' }] });
  });

  it('checks the connection, reporting "not connected" as data', async () => {
    await expect(runAction('checkConnection', {})).resolves.toMatchObject({ data: { isConnected: 1 } });
    expect(last().path).toBe('/v1/whatsapp/connection');
    await expect(runAction('checkConnection', {}, 'offline')).resolves.toMatchObject({ isConnected: 0, connected: false });
  });

  it('gets a send status and parses SyncMate\'s answer', async () => {
    await expect(runAction('getSendStatus', { jobId: ' job-1 ' })).resolves.toMatchObject({
      job_id: 'job-1',
      status: 'delivered',
      upstream_body: { success: true, message: 'Message sent' },
    });
    await expect(runAction('getSendStatus', { jobId: 'job-unknown' })).rejects.toThrow('Not found: Job not found');
    await expect(runAction('getSendStatus', { jobId: '../../v1/me' })).rejects.toThrow('job_id');
  });

  it('makes custom API calls with the same headers and base URL', async () => {
    const custom = action('custom_api_call');
    await custom.run({
      auth: authFor(),
      propsValue: { url: { url: `${baseUrl}/v1/me` }, method: 'GET', headers: {}, queryParams: {}, body_type: 'none', body: {}, failsafe: false, timeout: 0 },
    });
    expect(last().path).toBe('/v1/me');
    expectGatewayHeaders(last());
  });
});

describe('dropdowns', () => {
  const options = (prop: any, extra: Record<string, unknown> = {}) => prop.options({ auth: authFor(), ...extra }, {});

  it('groups', async () => {
    await expect(options(syncmateProps.group)).resolves.toEqual({
      disabled: false,
      options: [
        { label: 'Alpha Buyers', value: '120363002@g.us' },
        { label: 'Team Sales', value: '120363001@g.us' },
      ],
    });
  });

  it('channels', async () => {
    await expect(options(syncmateProps.channel)).resolves.toMatchObject({ options: [{ label: 'Offers', value: '120363555@newsletter' }] });
  });

  it('templates, de-duplicated by name', async () => {
    const state = await options(syncmateProps.template);
    expect(state.options.map((o: any) => o.value)).toEqual(['order_update', 'welcome']);
    expect(state.options[0].label).toBe('order_update (en · APPROVED · UTILITY)');
  });

  it('WhatsApp numbers for triggers, marking Meta and offline numbers', async () => {
    await expect(options(syncmateProps.connection)).resolves.toEqual({
      disabled: false,
      options: [
        { label: 'Sales (+919928044051)', value: 93 },
        { label: 'Support · Meta · not connected', value: 94 },
      ],
    });
  });

  it('asks to connect first, and shows a refusal instead of an empty list', async () => {
    await expect((syncmateProps.group as any).options({ auth: undefined }, {})).resolves.toMatchObject({ disabled: true });
    const refused = await (syncmateProps.group as any).options({ auth: { type: 'CUSTOM_AUTH', props: { apiKey: 'revoked', baseUrl } } }, {});
    expect(refused).toMatchObject({ disabled: true, placeholder: expect.stringContaining('revoked') });
  });

  it('template variables follow the chosen template', async () => {
    const variables = (metaSendTemplateAction.props as any).variables;
    const fields = await variables.props({ auth: authFor(), template: 'order_update' }, {});
    expect(Object.keys(fields)).toEqual(['1', '2']);
    expect(fields['1'].displayName).toBe('Variable {{1}}');
    expect(last().query).toEqual({ template: 'order_update' });
    await expect(variables.props({ auth: authFor(), template: 'missing' }, {})).resolves.toEqual({});
    await expect(variables.props({ auth: authFor(), template: undefined }, {})).resolves.toEqual({});
  });
});

describe('triggers (webhook)', () => {
  const HOOK = 'https://cloud.activepieces.com/api/v1/webhooks/Ab12Cd34/sync';

  function context(propsValue: Record<string, unknown>, payload?: unknown) {
    const store = new Map<string, unknown>();
    return {
      store,
      ctx: {
        auth: authFor(),
        propsValue,
        webhookUrl: HOOK,
        payload,
        store: {
          get: async (k: string) => (store.has(k) ? store.get(k) : null),
          put: async (k: string, v: unknown) => {
            store.set(k, v);
            return v;
          },
          delete: async (k: string) => {
            store.delete(k);
          },
        },
      } as any,
    };
  }

  function delivery(event: string, secret = 'whsec-test', ts = Math.floor(Date.now() / 1000)) {
    const body = { id: 'evt-1', event, message: { id: 'M1', text: 'Hi/там', media_url: 'https://x.test/a.png' }, contact: { phone: '919876543210' } };
    const rawBody = JSON.stringify(body);
    return {
      body,
      rawBody,
      headers: { 'x-assistro-timestamp': String(ts), 'x-assistro-signature': signEvent(secret, rawBody, ts), 'content-type': 'application/json' },
    };
  }

  it('New Message Received subscribes on enable, accepts signed events, unsubscribes on disable', async () => {
    const t = trigger('newMessageReceived');
    const { ctx, store } = context({ connection: 93 });

    await t.onEnable(ctx);
    const sub = requests.find((r) => r.path === '/v1/activepieces/events/subscriptions')!;
    expect(sub.method).toBe('POST');
    expectGatewayHeaders(sub);
    expect(sub.body).toEqual({ target_url: HOOK, event: 'message.received', connection_id: 93 });
    expect(store.get('syncmate_subscription')).toEqual({ id: '6704f0aa00000000000000a1', secret: 'whsec-test' });

    ctx.payload = delivery('message.received');
    await expect(t.run(ctx)).resolves.toEqual([ctx.payload.body]);

    await t.onDisable(ctx);
    expect(last().method).toBe('DELETE');
    expect(last().path).toBe('/v1/activepieces/events/subscriptions/6704f0aa00000000000000a1');
    expect(store.has('syncmate_subscription')).toBe(false);
  });

  it('drops forged, stale, re-targeted or wrong-event deliveries', async () => {
    const t = trigger('newMessageReceived');
    const { ctx } = context({});
    await t.onEnable(ctx);

    ctx.payload = delivery('message.received', 'attacker-secret');
    await expect(t.run(ctx)).resolves.toEqual([]);

    ctx.payload = delivery('message.received', 'whsec-test', Math.floor(Date.now() / 1000) - 3600);
    await expect(t.run(ctx)).resolves.toEqual([]);

    const tampered = delivery('message.received');
    tampered.rawBody = tampered.rawBody.replace('Hi', 'Pay');
    ctx.payload = tampered;
    await expect(t.run(ctx)).resolves.toEqual([]);

    ctx.payload = delivery('message.status');
    await expect(t.run(ctx)).resolves.toEqual([]);
  });

  it('verifies against the parsed body when Activepieces gives no raw body', async () => {
    const t = trigger('newMessageReceived');
    const { ctx } = context({});
    await t.onEnable(ctx);
    const { body, headers } = delivery('message.received');
    ctx.payload = { body, headers };
    await expect(t.run(ctx)).resolves.toEqual([body]);
  });

  it('Number Type limits a trigger to Meta or standard numbers; "Both" sends no mode', async () => {
    const t = trigger('newOutgoingMessage');
    const meta = context({ mode: 'meta' });
    await t.onEnable(meta.ctx);
    expect(last().body).toEqual({ target_url: HOOK, event: 'message.sent', mode: 'meta' });

    const both = context({ mode: 'all' });
    await t.onEnable(both.ctx);
    expect(last().body).toEqual({ target_url: HOOK, event: 'message.sent' });
  });

  it('Message Status Updated passes the chosen statuses', async () => {
    const t = trigger('messageStatusUpdated');
    const { ctx } = context({ connection: 94, statuses: ['read', 'failed'] });
    await t.onEnable(ctx);
    expect(last().body).toEqual({ target_url: HOOK, event: 'message.status', connection_id: 94, statuses: ['read', 'failed'] });

    ctx.payload = delivery('message.status');
    await expect(t.run(ctx)).resolves.toHaveLength(1);
  });

  it('test step returns real recent events, else the built-in sample', async () => {
    const t = trigger('messageStatusUpdated');
    const withEvents = context({ connection: 93 });
    await expect(t.test(withEvents.ctx)).resolves.toEqual([{ id: 'evt-real', event: 'message.status' }]);
    expect(last().query).toEqual({ event: 'message.status', connection_id: '93' });

    const filtered = context({ connection: 93, mode: 'standard', statuses: ['read', 'failed'] });
    await t.test(filtered.ctx);
    expect(last().query).toEqual({ event: 'message.status', connection_id: '93', mode: 'standard', statuses: 'read,failed' });

    const empty = context({ connection: 94 });
    const out = await t.test(empty.ctx);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ event: 'message.status', message: { direction: 'outgoing', status: 'delivered' } });
  });

  it('disable is safe when the subscription is already gone or was never made', async () => {
    const t = trigger('newMessageReceived');
    const gone = context({});
    await gone.ctx.store.put('syncmate_subscription', { id: 'sub-deleted', secret: 'x' });
    await expect(t.onDisable(gone.ctx)).resolves.toBeUndefined();
    expect(gone.store.has('syncmate_subscription')).toBe(false);

    requests.length = 0;
    const never = context({});
    await expect(t.onDisable(never.ctx)).resolves.toBeUndefined();
    expect(requests).toHaveLength(0);
  });

  it('enable fails loudly when SyncMate refuses (platform not enabled for the account)', async () => {
    const t = trigger('newMessageReceived');
    const { ctx } = context({});
    ctx.auth = authFor('revoked');
    await expect(t.onEnable(ctx)).rejects.toThrow('invalid or was revoked');
  });
});
