import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { API_KEY, BASE, fail, lastRequest, ok, sendRequest } from './helpers';
import { MoxieApiError, MoxieCRMClient, assertMoxieRequestUrl, looksLikeWebPage, normalizeBaseUrl } from '../src/lib/common/client';
import { moxieCRMAuth } from '../src/lib/auth';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

function buildClient({ baseUrl = BASE }: { baseUrl?: string } = {}) {
  return new MoxieCRMClient({ baseUrl, apiKey: API_KEY });
}

function validate({ baseUrl, apiKey = API_KEY }: { baseUrl: string; apiKey?: string }): Promise<unknown> {
  const fn: unknown = Reflect.get(moxieCRMAuth, 'validate');
  if (typeof fn !== 'function') {
    throw new Error('validate missing');
  }
  return Promise.resolve(Reflect.apply(fn, undefined, [{ auth: { baseUrl, apiKey }, server: {} }]));
}

beforeEach(() => {
  sendRequest.mockReset();
  sendRequest.mockResolvedValue({ status: 200, headers: {}, body: [] });
});

describe('base url handling', () => {
  test('a base url without a trailing slash builds a single-slash path', async () => {
    await buildClient().listWorkspaceUsers();
    expect(lastRequest()['url']).toBe(`${BASE}/action/users/list`);
  });

  test('a trailing slash on the base url does not produce a double slash', async () => {
    await buildClient({ baseUrl: `${BASE}/` }).listWorkspaceUsers();
    expect(lastRequest()['url']).toBe(`${BASE}/action/users/list`);
  });

  test('every request carries the X-API-KEY header and no bearer token', async () => {
    await buildClient().listPipelineStages();
    expect(lastRequest()['headers']).toEqual({ 'X-API-KEY': API_KEY });
  });

  test('normalizeBaseUrl accepts the documented pod URL and strips the trailing slash', () => {
    expect(normalizeBaseUrl({ baseUrl: ' https://pod01.withmoxie.com/api/public/ ' })).toBe(BASE);
    expect(normalizeBaseUrl({ baseUrl: 'https://withmoxie.com/api/public' })).toBe('https://withmoxie.com/api/public');
  });

  test.each([
    ['http://pod01.withmoxie.com/api/public'],
    ['https://pod01.withmoxie.com.evil.io/api/public'],
    ['https://evilwithmoxie.com/api/public'],
    ['https://x@pod01.withmoxie.com/api/public'],
    ['https://pod01.withmoxie.com:8443/api/public'],
    ['https://pod01.withmoxie.com/api/public?x=1'],
    ['https://evil.io'],
    ['not a url'],
    [''],
  ])('normalizeBaseUrl rejects %s', (baseUrl) => {
    expect(() => normalizeBaseUrl({ baseUrl })).toThrow(MoxieApiError);
  });

  test('a lookalike host never receives the API key', async () => {
    await expect(buildClient({ baseUrl: 'https://pod01.withmoxie.com.evil.io/api/public' }).listClients()).rejects.toThrow(
      'withmoxie.com',
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('read and search endpoints keep their request shape', () => {
  test('listClients calls GET /action/clients/list with no body or query', async () => {
    await buildClient().listClients();
    expect(lastRequest()).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/action/clients/list` });
    expect(lastRequest()['body']).toBeUndefined();
    expect(lastRequest()['queryParams']).toBeUndefined();
  });

  test('listInvoiceTemplates calls GET /action/invoiceTemplates/list', async () => {
    await buildClient().listInvoiceTemplates();
    expect(lastRequest()['url']).toBe(`${BASE}/action/invoiceTemplates/list`);
  });

  test('searchClients sends the query as a query param, unencoded', async () => {
    await buildClient().searchClients({ query: 'Ada & Co' });
    expect(lastRequest()).toMatchObject({ url: `${BASE}/action/clients/search`, queryParams: { query: 'Ada & Co' } });
  });

  test('searchContacts with no query omits queryParams entirely', async () => {
    await buildClient().searchContacts();
    expect(lastRequest()['queryParams']).toBeUndefined();
    await buildClient().searchContacts({ query: '' });
    expect(lastRequest()['queryParams']).toBeUndefined();
  });

  test('searchProjects sends an id lookup', async () => {
    await buildClient().searchProjects({ id: 'p1' });
    expect(lastRequest()).toMatchObject({ url: `${BASE}/action/projects/search`, queryParams: { id: 'p1' } });
  });

  test('createContact posts the request body unchanged', async () => {
    const body = { first: 'Ada', last: 'Chen', clientName: 'Moxie', defaultContact: true };
    await buildClient().createContact(body);
    expect(lastRequest()).toMatchObject({ method: HttpMethod.POST, url: `${BASE}/action/contacts/create`, body });
  });

  test('methods return response.body, not the HttpResponse wrapper', async () => {
    const payload = [{ id: 'c1', name: 'Moxie' }];
    sendRequest.mockResolvedValue({ status: 200, headers: { 'x-secret': 'no' }, body: payload });
    await expect(buildClient().listClients()).resolves.toBe(payload);
  });
});

describe('a web page instead of API data fails the step', () => {
  test('an HTML content type throws a Base URL hint', async () => {
    ok({ body: '<!DOCTYPE html><html></html>', headers: { 'content-type': 'text/html; charset=utf-8' } });
    await expect(buildClient().listPipelineStages()).rejects.toThrow('Moxie returned a web page instead of API data');
  });

  test('a string body that starts with < throws even without a content type', async () => {
    ok({ body: '  <html>' });
    await expect(buildClient().listPipelineStages()).rejects.toThrow('Base URL');
  });

  test('a JSON string body, such as an attachment URL, is valid', async () => {
    ok({ body: 'https://files.withmoxie.com/a.png', headers: { 'content-type': 'application/json' } });
    await expect(buildClient().request({ method: HttpMethod.POST, path: '/action/attachments/createFromUrl' })).resolves.toBe(
      'https://files.withmoxie.com/a.png',
    );
  });

  test('looksLikeWebPage reads header names case-insensitively', () => {
    expect(looksLikeWebPage({ headers: { 'Content-Type': 'text/html' }, body: {} })).toBe(true);
    expect(looksLikeWebPage({ headers: { 'content-type': 'application/json' }, body: [] })).toBe(false);
  });
});

describe('custom API call URL guard', () => {
  test.each([
    ['a relative path', '/action/clients/list'],
    ['a full URL on the Base URL host', 'https://pod01.withmoxie.com/api/public/action/clients/list'],
    ['an empty URL', undefined],
  ])('allows %s', (_label, url) => {
    expect(() => assertMoxieRequestUrl({ baseUrl: 'https://pod01.withmoxie.com/api/public', url })).not.toThrow();
  });

  test.each([
    ['another host', 'https://attacker.example/steal'],
    ['a look-alike host', 'https://pod01.withmoxie.com.evil.io/api'],
    ['another Moxie pod', 'https://pod02.withmoxie.com/api/public/action/clients/list'],
    ['plain http on the same host', 'http://pod01.withmoxie.com/api/public/action/clients/list'],
    ['user info in the URL', 'https://user:pw@pod01.withmoxie.com/api/public'],
  ])('refuses %s before the API key is attached', (_label, url) => {
    expect(() => assertMoxieRequestUrl({ baseUrl: 'https://pod01.withmoxie.com/api/public', url })).toThrow(
      'only sends the Moxie API key to your Base URL host',
    );
  });
});

describe('vendor errors', () => {
  test('a 401 names the API key and keeps the vendor text in responseBody, not body', async () => {
    const vendor = { status: 401, error: 'Unauthorized', message: 'Invalid X-API-Key specified.' };
    fail({ status: 401, body: vendor });
    const error = await buildClient().listClients().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MoxieApiError);
    expect(error).toMatchObject({ status: 401, responseBody: vendor });
    expect(String(Reflect.get(Object(error), 'message'))).toContain('Moxie rejected the API key');
    expect(String(Reflect.get(Object(error), 'message'))).toContain('Invalid X-API-Key specified.');
    expect(Reflect.has(Object(error), 'body')).toBe(false);
  });

  test('an unknown route points at the Base URL', async () => {
    fail({ status: 404, body: 'No endpoint GET /action/clients/list.' });
    await expect(buildClient().listClients()).rejects.toThrow('Check the connection');
  });

  test('a 429 is reported as rate limiting', async () => {
    fail({ status: 429, body: { status: 429, message: 'Too Many Requests' } });
    await expect(buildClient().listClients()).rejects.toThrow('Moxie is rate limiting this workspace (HTTP 429)');
  });

  test('searchProjects with an unknown client explains that the query is an exact client name', async () => {
    fail({ status: 404, body: { status: 404, message: 'Client not found' } });
    await expect(buildClient().searchProjects({ query: 'Nobody' })).rejects.toThrow('No client named "Nobody"');
  });

  test('a network error propagates unchanged', async () => {
    sendRequest.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND'));
    await expect(buildClient().listClients()).rejects.toThrow('getaddrinfo ENOTFOUND');
  });
});

describe('auth.validate', () => {
  test('GET /api/auth with an account id is valid', async () => {
    ok({ body: { accountId: 10016, accountName: 'Moxie' } });
    await expect(validate({ baseUrl: `${BASE}/` })).resolves.toEqual({ valid: true });
    expect(lastRequest()).toMatchObject({ method: HttpMethod.GET, url: `${BASE}/api/auth`, headers: { 'X-API-KEY': API_KEY } });
  });

  test('a 401 is reported as an invalid API key', async () => {
    fail({ status: 401, body: { message: 'Invalid X-API-Key specified.' } });
    await expect(validate({ baseUrl: BASE })).resolves.toMatchObject({ valid: false, error: expect.stringContaining('Invalid API key') });
  });

  test('the web-app URL is reported as not the API URL', async () => {
    ok({ body: '<!DOCTYPE html>', headers: { 'content-type': 'text/html' } });
    await expect(validate({ baseUrl: 'https://create.withmoxie.com/me/profile' })).resolves.toMatchObject({
      valid: false,
      error: expect.stringContaining('not the Moxie API URL'),
    });
  });

  test('a 404 is reported as not the API URL', async () => {
    fail({ status: 404, body: 'No endpoint GET /api/auth.' });
    await expect(validate({ baseUrl: 'https://pod01.withmoxie.com' })).resolves.toMatchObject({
      valid: false,
      error: expect.stringContaining('not the Moxie API URL'),
    });
  });

  test('a non-Moxie host is refused before any request', async () => {
    await expect(validate({ baseUrl: 'https://evil.io/api/public' })).resolves.toMatchObject({
      valid: false,
      error: expect.stringContaining('withmoxie.com'),
    });
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
