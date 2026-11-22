import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { ClockodoClient, ClockodoError } from '../src/lib/common/client';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

const sendRequest = vi.fn();


const AUTH = {
  email: ' me@example.org ',
  token: ' key-1 ',
  company_name: 'Acme',
  company_email: 'dev@acme.test',
};

const BASE = 'https://my.clockodo.com/api';

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function client() {
  return new ClockodoClient({
    email: AUTH.email,
    token: AUTH.token,
    clientName: AUTH.company_name,
    clientEmail: AUTH.company_email,
  });
}

function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError({}, { status, responseBody: body });
}

afterEach(() => {
  sendRequest.mockReset();
  vi.useRealTimers();
});

describe('endpoints', () => {
  const singleCases: [SingleGetter, string, string][] = [
    ['getCustomer', '/v3/customers/7', 'customer'],
    ['getProject', '/v4/projects/7', 'project'],
    ['getService', '/v4/services/7', 'service'],
    ['getUser', '/v3/users/7', 'user'],
    ['getTeam', '/v3/teams/7', 'team'],
    ['getAbsence', '/v4/absences/7', 'absence'],
    ['getEntry', '/v2/entries/7', 'entry'],
  ];
  it.each(singleCases)('%s calls %s and unwraps data or the legacy key', async (method, path, legacyKey) => {
    sendRequest.mockResolvedValueOnce(ok({ data: { id: 7 } }));
    sendRequest.mockResolvedValueOnce(ok({ [legacyKey]: { id: 7 } }));
    const c = client();
    await expect(Reflect.apply(c[method], c, [7])).resolves.toMatchObject({ id: 7 });
    await expect(Reflect.apply(c[method], c, [7])).resolves.toMatchObject({ id: 7 });
    const req = sendRequest.mock.calls[0][0];
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.url).toBe(BASE + path);
  });

  it('sends trimmed auth headers and the external application header', async () => {
    sendRequest.mockResolvedValue(ok({ data: { id: 1 } }));
    await client().getCurrentUser();
    const req = sendRequest.mock.calls[0][0];
    expect(req.url).toBe(BASE + '/v4/users/me');
    expect(req.headers['X-ClockodoApiUser']).toBe('me@example.org');
    expect(req.headers['X-ClockodoApiKey']).toBe('key-1');
    expect(req.headers['X-Clockodo-External-Application']).toBe('Acme;dev@acme.test');
    expect(req.headers.Accept).toBe('application/json');
  });

  it('never calls a removed legacy endpoint', async () => {
    sendRequest.mockResolvedValue(ok({ data: [], paging: { count_pages: 1 } }));
    const c = client();
    await c.listUsers();
    await c.listTeams();
    await c.listServices();
    await c.listAllCustomers();
    await c.listAllProjects();
    await c.listAbsences({ year: 2026 });
    await c.listLumpSumServices();
    await c.listSubprojects();
    const urls = sendRequest.mock.calls.map((call) => call[0].url);
    expect(urls).toEqual([
      BASE + '/v3/users',
      BASE + '/v3/teams',
      BASE + '/v4/services',
      BASE + '/v3/customers',
      BASE + '/v4/projects',
      BASE + '/v4/absences',
      BASE + '/v4/lumpSumServices',
      BASE + '/v3/subprojects',
    ]);
    expect(sendRequest.mock.calls[5][0].queryParams).toEqual({ 'filter[year]': '2026', page: '1' });
  });
});

describe('pagination', () => {
  it('follows every page', async () => {
    sendRequest
      .mockResolvedValueOnce(ok({ data: [{ id: 1 }], paging: { count_pages: 2 } }))
      .mockResolvedValueOnce(ok({ data: [{ id: 2 }], paging: { count_pages: 2 } }));
    const res = await client().listAllCustomers({ active: true });
    expect(res).toEqual([{ id: 1 }, { id: 2 }]);
    expect(sendRequest.mock.calls[1][0].queryParams).toEqual({ 'filter[active]': 'true', page: '2' });
  });

  it('throws at the page cap instead of truncating', async () => {
    sendRequest.mockResolvedValue(ok({ data: [{ id: 1 }], paging: { count_pages: 500 } }));
    await expect(client().listAllProjects()).rejects.toThrow(/stopped after 100 pages/);
    expect(sendRequest).toHaveBeenCalledTimes(100);
  });

  it('rejects a body without a list', async () => {
    sendRequest.mockResolvedValue(ok({ something: 1 }));
    await expect(client().listUsers()).rejects.toThrow(/unexpected response/);
  });
});

describe('errors', () => {
  it.each([
    [400, { error: { message: 'Field name is required' } }, /create customer failed \(400\): Field name is required/],
    [401, {}, /failed \(401\): authentication failed/],
    [404, '', /failed \(404\): the requested record was not found/],
  ])('maps %s', async (status, body, pattern) => {
    sendRequest.mockRejectedValue(httpError({ status, body }));
    const err = await client().createCustomer({ name: 'x' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ClockodoError);
    expect(String(err)).toMatch(pattern);
    expect(err).toMatchObject({ httpStatus: status, responseBody: body });
    expect(err).not.toHaveProperty('status');
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('reads the v3/v4 errors array with path', async () => {
    sendRequest.mockRejectedValue(
      httpError({
        status: 422,
        body: { errors: [{ type: 'UnexpectedValue', message: 'Only these values are expected: 1, 2.', details: null, path: 'color' }] },
      })
    );
    await expect(client().createCustomer({ name: 'x' })).rejects.toThrow(
      'Clockodo create customer failed (422): Only these values are expected: 1, 2 (color).'
    );
  });

  it('reads a v3 error without path', async () => {
    sendRequest.mockRejectedValue(httpError({ status: 400, body: { errors: [{ message: 'The resource must be inactive.', path: null }] } }));
    await expect(client().deleteCustomer(1)).rejects.toThrow('Clockodo delete customer failed (400): The resource must be inactive.');
  });

  it('adds a permission hint after Clockodo text on 403', async () => {
    const body = { errors: [{ message: 'Access denied.' }] };
    sendRequest.mockRejectedValue(httpError({ status: 403, body }));
    const err = await client().deleteUser(3).catch((e: unknown) => e);
    expect(String(err)).toContain(
      'Clockodo delete user failed (403): Access denied. The Clockodo user on this connection does not have permission for this action (check the user\'s role or access group in Clockodo).'
    );
    expect(err).toMatchObject({ httpStatus: 403, responseBody: body });
  });

  it('does not double the period on v2 messages', async () => {
    sendRequest.mockRejectedValue(httpError({ status: 409, body: { error: { message: 'Entry has already been stopped.' } } }));
    const err = await client().stopClock(5).catch((e: unknown) => e);
    expect(String(err)).toMatch(/failed \(409\): Entry has already been stopped\.$/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('retries a write on 409 "Please try again later."', async () => {
    vi.useFakeTimers();
    sendRequest
      .mockRejectedValueOnce(httpError({ status: 409, body: { error: { message: 'Please try again later.' } } }))
      .mockResolvedValueOnce(ok({ entry: { id: 1 } }));
    const promise = client().createEntry({ customers_id: 1, services_id: 2, time_since: 'a', time_until: 'b' });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ id: 1 });
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('retries GET on 429 then reports retry advice', async () => {
    vi.useFakeTimers();
    sendRequest.mockRejectedValue(httpError({ status: 429, body: {} }));
    const promise = client().getCustomer(1).catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    const err = await promise;
    expect(String(err)).toMatch(/429.*Wait a minute and retry/);
    expect(sendRequest).toHaveBeenCalledTimes(3);
  });

  it('recovers from a transient GET failure', async () => {
    vi.useFakeTimers();
    sendRequest.mockRejectedValueOnce(httpError({ status: 503, body: {} })).mockResolvedValueOnce(ok({ data: { id: 1 } }));
    const promise = client().getCustomer(1);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ id: 1 });
  });

  it('does not retry writes and warns they may have applied', async () => {
    sendRequest.mockRejectedValue(new Error('socket hang up'));
    await expect(client().createEntry({ customers_id: 1, services_id: 2, time_since: 'a', time_until: 'b' })).rejects.toThrow(
      /did not complete.*may still have been applied/
    );
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });
});

type SingleGetter = 'getCustomer' | 'getProject' | 'getService' | 'getUser' | 'getTeam' | 'getAbsence' | 'getEntry';
