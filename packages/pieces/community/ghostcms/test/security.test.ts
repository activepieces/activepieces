/// <reference types="vitest/globals" />

import crypto from 'crypto';
import { ghostAuth } from '../src/lib/auth';
import { assertGhostUrl } from '../src/lib/common/custom-api-guard';
import { ghostWebhook } from '../src/lib/common/webhooks';
import { ADMIN_URL, FIXTURE_AUTH, memoryStore, mockGhost } from './helpers';

const STORE_KEY = '_member_added_trigger';
const SERVER = { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => '' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Custom API Call only sends the key to the connection admin API', () => {
  test.each(['/posts/', 'posts/?limit=1', `${ADMIN_URL}/site/`, `${ADMIN_URL}?x=1`])('allows %s', (url) => {
    expect(() => assertGhostUrl({ auth: FIXTURE_AUTH, propsValue: { url: { url } } })).not.toThrow();
  });

  test.each([
    'https://blog.example.com.evil.io/ghost/api/admin/site/',
    'https://evil.io/ghost/api/admin/site/',
    'http://blog.example.com/ghost/api/admin/site/',
    'https://blog.example.com/ghost/api/content/posts/',
    '//evil.io/x',
    'HTTPS://evil.io/',
    '/../content/',
    '/%2e%2e/content/',
  ])('refuses %s', (url) => {
    expect(() => assertGhostUrl({ auth: FIXTURE_AUTH, propsValue: { url: { url } } })).toThrow(
      'Custom API Call only sends your Ghost Admin API key'
    );
  });
});

describe('webhook triggers', () => {
  test('enable registers the webhook with a signing secret and stores both', async () => {
    const requests = mockGhost({ replies: [{ status: 201, body: { webhooks: [{ id: 'w1' }] } }] });
    const store = memoryStore();
    await ghostWebhook.enable({ auth: FIXTURE_AUTH, event: 'member.added', webhookUrl: 'https://ap.test/hook', store, storeKey: STORE_KEY });
    const sent = JSON.stringify(requests[0].body);
    const stored = store.data.get(STORE_KEY);
    expect(requests[0].url).toBe(`${ADMIN_URL}/webhooks`);
    expect(sent).toContain('"event":"member.added"');
    expect(stored).toMatchObject({ webhookId: 'w1' });
    expect(JSON.stringify(stored)).toMatch(/"secret":"[0-9a-f]{64}"/);
  });

  test('enable deletes the webhook it created when the store write fails', async () => {
    const requests = mockGhost({ replies: [{ status: 201, body: { webhooks: [{ id: 'w1' }] } }, { status: 204, body: '' }] });
    const store = { ...memoryStore(), put: async () => Promise.reject(new Error('store down')) };
    await expect(
      ghostWebhook.enable({ auth: FIXTURE_AUTH, event: 'member.added', webhookUrl: 'https://ap.test/hook', store, storeKey: STORE_KEY })
    ).rejects.toThrow('store down');
    expect(requests[1].method).toBe('DELETE');
    expect(requests[1].url).toBe(`${ADMIN_URL}/webhooks/w1`);
  });

  test('disable forgets the webhook after a confirmed delete, and a 404 counts as deleted', async () => {
    mockGhost({ replies: [{ error: { status: 404, body: { errors: [{ message: 'Webhook not found.' }] } } }] });
    const store = memoryStore({ initial: { [STORE_KEY]: { webhookId: 'w1', secret: 's' } } });
    await ghostWebhook.disable({ auth: FIXTURE_AUTH, store, storeKey: STORE_KEY });
    expect(store.data.has(STORE_KEY)).toBe(false);
  });

  test('disable keeps the webhook ID when Ghost fails to delete it', async () => {
    mockGhost({ replies: [{ error: { status: 500, body: { errors: [{ message: 'boom' }] } } }] });
    const store = memoryStore({ initial: { [STORE_KEY]: { webhookId: 'w1', secret: 's' } } });
    await expect(ghostWebhook.disable({ auth: FIXTURE_AUTH, store, storeKey: STORE_KEY })).rejects.toThrow('(500)');
    expect(store.data.has(STORE_KEY)).toBe(true);
  });

  test('a delivery signed with the stored secret is accepted, and a tampered or unsigned one is refused', async () => {
    const secret = 'a'.repeat(64);
    const rawBody = '{"member":{"current":{"id":"m1"}}}';
    const timestamp = '1790623913000';
    const signature = crypto.createHmac('sha256', secret).update(`${rawBody}${timestamp}`).digest('hex');
    const store = memoryStore({ initial: { [STORE_KEY]: { webhookId: 'w1', secret } } });
    const headers = { 'X-Ghost-Signature': `sha256=${signature}, t=${timestamp}` };
    await expect(ghostWebhook.assertSigned({ store, storeKey: STORE_KEY, rawBody, headers })).resolves.toBeUndefined();
    await expect(
      ghostWebhook.assertSigned({ store, storeKey: STORE_KEY, rawBody: rawBody.replace('m1', 'm2'), headers })
    ).rejects.toThrow('did not match');
    await expect(ghostWebhook.assertSigned({ store, storeKey: STORE_KEY, rawBody, headers: {} })).rejects.toThrow('did not match');
  });

  test('a trigger enabled before signing existed keeps accepting deliveries', async () => {
    const store = memoryStore({ initial: { [STORE_KEY]: { webhookId: 'w1' } } });
    await expect(ghostWebhook.assertSigned({ store, storeKey: STORE_KEY, rawBody: '{}', headers: {} })).resolves.toBeUndefined();
  });
});

describe('connection check', () => {
  const validate = ghostAuth.validate;

  test('a working key is valid', async () => {
    const requests = mockGhost({ replies: [{ body: { users: [] } }] });
    await expect(validate?.({ auth: { baseUrl: 'https://blog.example.com', apiKey: FIXTURE_AUTH.props.apiKey }, server: SERVER })).resolves.toEqual({ valid: true });
    expect(requests[0].url).toBe(`${ADMIN_URL}/users/`);
  });

  test('only a 401 or 403 is reported as an invalid key', async () => {
    mockGhost({ replies: [{ error: { status: 401, body: {} } }, { error: { status: 500, body: {} } }] });
    const auth = { baseUrl: 'https://blog.example.com', apiKey: FIXTURE_AUTH.props.apiKey };
    const rejected = await validate?.({ auth, server: SERVER });
    const unreachable = await validate?.({ auth, server: SERVER });
    expect(rejected).toMatchObject({ valid: false, error: expect.stringContaining('Invalid Admin API Key') });
    expect(unreachable).toMatchObject({ valid: false, error: expect.stringContaining('Could not verify the connection') });
    expect(JSON.stringify(unreachable)).not.toContain('Invalid Admin API Key');
  });

  test.each(['ftp://blog.example.com', 'blog.example.com', 'https://user:pass@blog.example.com'])(
    'refuses the API URL %s without calling Ghost',
    async (baseUrl) => {
      const requests = mockGhost({ replies: [] });
      const result = await validate?.({ auth: { baseUrl, apiKey: FIXTURE_AUTH.props.apiKey }, server: SERVER });
      expect(result).toMatchObject({ valid: false });
      expect(requests).toHaveLength(0);
    }
  );
});
