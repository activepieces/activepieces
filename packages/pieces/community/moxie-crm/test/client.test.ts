/// <reference types="vitest/globals" />

import { HttpMethod } from '@activepieces/pieces-common';

const { sendRequest } = vi.hoisted(() => ({
  sendRequest: vi.fn(),
}));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: { sendRequest },
  };
});

const { MoxieCRMClient } = await import('../src/lib/common/client');

const BASE_URL = 'https://pod01.withmoxie.com/api/public';
const API_KEY = 'test-api-key';

function buildClient(baseUrl: string = BASE_URL) {
  return new MoxieCRMClient(baseUrl, API_KEY);
}

function lastRequest() {
  return sendRequest.mock.calls[sendRequest.mock.calls.length - 1][0];
}

beforeEach(() => {
  sendRequest.mockReset();
  sendRequest.mockResolvedValue({ status: 200, headers: {}, body: [] });
});

describe('MoxieCRMClient base url handling', () => {
  test('a base url without a trailing slash builds a single-slash path', async () => {
    await buildClient().listWorkspaceUsers();

    expect(lastRequest().url).toBe(
      'https://pod01.withmoxie.com/api/public/action/users/list'
    );
  });

  test('a trailing slash on the base url does not produce a double slash', async () => {
    await buildClient(`${BASE_URL}/`).listWorkspaceUsers();

    expect(lastRequest().url).toBe(
      'https://pod01.withmoxie.com/api/public/action/users/list'
    );
    expect(lastRequest().url).not.toContain('//action');
  });

  test('every request carries the X-API-KEY header and no bearer token', async () => {
    await buildClient().listPipelineStages();

    expect(lastRequest().headers).toEqual({ 'X-API-KEY': API_KEY });
    expect(lastRequest().headers).not.toHaveProperty('Authorization');
  });
});

describe('MoxieCRMClient read endpoints', () => {
  test('listClients calls GET /action/clients/list with no body or query', async () => {
    await buildClient().listClients();

    expect(lastRequest()).toMatchObject({
      method: HttpMethod.GET,
      url: `${BASE_URL}/action/clients/list`,
    });
    expect(lastRequest().body).toBeUndefined();
    expect(lastRequest().queryParams).toBeUndefined();
  });

  test('listPipelineStages calls GET /action/pipelineStages/list', async () => {
    await buildClient().listPipelineStages();

    expect(lastRequest().method).toBe(HttpMethod.GET);
    expect(lastRequest().url).toBe(`${BASE_URL}/action/pipelineStages/list`);
  });

  test('listWorkspaceUsers calls GET /action/users/list', async () => {
    await buildClient().listWorkspaceUsers();

    expect(lastRequest().method).toBe(HttpMethod.GET);
    expect(lastRequest().url).toBe(`${BASE_URL}/action/users/list`);
  });

  test('listInvoiceTemplates calls GET /action/invoiceTemplates/list', async () => {
    await buildClient().listInvoiceTemplates();

    expect(lastRequest().url).toBe(
      `${BASE_URL}/action/invoiceTemplates/list`
    );
  });
});

describe('MoxieCRMClient search endpoints', () => {
  test('searchClients sends the query as a query param, not in the path', async () => {
    await buildClient().searchClients('Moxie');

    expect(lastRequest()).toMatchObject({
      method: HttpMethod.GET,
      url: `${BASE_URL}/action/clients/search`,
      queryParams: { query: 'Moxie' },
    });
    expect(lastRequest().url).not.toContain('Moxie');
  });

  test('searchClients passes a query with spaces and ampersands through unencoded', async () => {
    await buildClient().searchClients('Ada & Co');

    expect(lastRequest().queryParams).toEqual({ query: 'Ada & Co' });
  });

  test('searchProjects sends the query as a query param', async () => {
    await buildClient().searchProjects('Moxie');

    expect(lastRequest()).toMatchObject({
      method: HttpMethod.GET,
      url: `${BASE_URL}/action/projects/search`,
      queryParams: { query: 'Moxie' },
    });
  });

  test('searchContacts with a query sends it', async () => {
    await buildClient().searchContacts('ada');

    expect(lastRequest()).toMatchObject({
      url: `${BASE_URL}/action/contacts/search`,
      queryParams: { query: 'ada' },
    });
  });

  test('searchContacts with no query omits queryParams entirely', async () => {
    await buildClient().searchContacts();

    expect(lastRequest().url).toBe(`${BASE_URL}/action/contacts/search`);
    expect(lastRequest().queryParams).toBeUndefined();
  });

  test('searchContacts with an empty query omits queryParams rather than sending query=', async () => {
    await buildClient().searchContacts('');

    expect(lastRequest().queryParams).toBeUndefined();
  });
});

describe('MoxieCRMClient createContact', () => {
  test('posts the request body to /action/contacts/create', async () => {
    const request = {
      first: 'Ada',
      last: 'Chen',
      email: 'ada@example.com',
      clientName: 'Moxie',
      defaultContact: true,
    };

    await buildClient().createContact(request);

    expect(lastRequest()).toMatchObject({
      method: HttpMethod.POST,
      url: `${BASE_URL}/action/contacts/create`,
      body: request,
    });
  });

  test('omitted optional fields are not invented', async () => {
    await buildClient().createContact({ first: 'Ada', last: 'Chen' });

    expect(lastRequest().body).toEqual({ first: 'Ada', last: 'Chen' });
  });
});

describe('MoxieCRMClient response unwrapping', () => {
  test('every method returns response.body, not the HttpResponse wrapper', async () => {
    const payload = [{ id: 'c1', name: 'Moxie' }];
    sendRequest.mockResolvedValue({
      status: 200,
      headers: { 'x-secret': 'do-not-surface' },
      body: payload,
    });

    const client = buildClient();

    await expect(client.listClients()).resolves.toBe(payload);
    await expect(client.searchClients('Moxie')).resolves.toBe(payload);
    await expect(client.searchContacts()).resolves.toBe(payload);
    await expect(client.listPipelineStages()).resolves.toBe(payload);
    await expect(client.listWorkspaceUsers()).resolves.toBe(payload);
  });

  test('an empty result set comes back as an empty array, not undefined', async () => {
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: [] });

    await expect(buildClient().searchClients('nothing')).resolves.toEqual([]);
  });

  test('a rejected request propagates rather than resolving undefined', async () => {
    sendRequest.mockRejectedValue(new Error('429 Too Many Requests'));

    await expect(buildClient().listClients()).rejects.toThrow(
      '429 Too Many Requests'
    );
  });
});
