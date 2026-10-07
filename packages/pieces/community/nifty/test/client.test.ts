import { HttpMethod } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NiftyApiError, niftyClient } from '../src/lib/common/client';
import { niftyProps } from '../src/lib/common';
import { httpError, ok, testAuth } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

beforeEach(() => {
  sendRequest.mockReset();
});

describe('request', () => {
  it('sends a bearer token to the constant v1 host and drops undefined query values', async () => {
    sendRequest.mockResolvedValueOnce(ok({ id: 'x' }));
    await niftyClient.request({ auth: testAuth(), method: HttpMethod.GET, path: 'tasks/abc', query: { a: 1, b: undefined, c: true } });
    const req = sendRequest.mock.calls[0][0];
    expect(req.url).toBe('https://openapi.niftypm.com/api/v1.0/tasks/abc');
    expect(req.queryParams).toEqual({ a: '1', c: 'true' });
    expect(req.authentication).toEqual({ type: 'BEARER_TOKEN', token: 'tok_test' });
  });

  it.each(['/tasks', 'https://evil.io/x', '../oauth', 'tasks\\x'])('refuses unexpected path %s', async (path) => {
    await expect(niftyClient.request({ auth: testAuth(), method: HttpMethod.GET, path })).rejects.toThrow('unexpected Nifty path');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('maps a 403 to an access sentence with responseBody and no body field', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 403, body: { message: 'Forbidden resource', code: 403 } }));
    const error = await niftyClient.request({ auth: testAuth(), method: HttpMethod.GET, path: 'subteams' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NiftyApiError);
    expect(error).toMatchObject({ status: 403, responseBody: { message: 'Forbidden resource', code: 403 } });
    expect(error).not.toHaveProperty('body');
    expect(String(error)).toContain('Nifty refused access (403): Forbidden resource.');
    expect(String(error)).not.toContain('invalid credentials');
  });

  it('includes field errors and trims the vendor period on 400 and 404', async () => {
    sendRequest.mockRejectedValueOnce(
      httpError({ status: 400, body: { message: 'Validation failed: archived', errors: [{ message: 'archived must be true or false' }] } })
    );
    await expect(niftyClient.request({ auth: testAuth(), method: HttpMethod.PUT, path: 'projects/p' })).rejects.toThrow(
      'Nifty rejected the request (400): Validation failed: archived (archived must be true or false).'
    );
    sendRequest.mockRejectedValueOnce(httpError({ status: 404, body: { message: 'This task has been deleted or no longer exists.' } }));
    await expect(niftyClient.request({ auth: testAuth(), method: HttpMethod.GET, path: 'tasks/x' })).rejects.toThrow(
      'Nifty could not find the record (404): This task has been deleted or no longer exists. It may'
    );
  });

  it('rethrows non-HTTP errors unchanged', async () => {
    const boom = new Error('socket hang up');
    sendRequest.mockRejectedValueOnce(boom);
    await expect(niftyClient.request({ auth: testAuth(), method: HttpMethod.GET, path: 'tasks' })).rejects.toBe(boom);
  });
});

describe('listAll', () => {
  it('pages with limit 1000 and offset until a short page', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ id: `p${i}` }));
    sendRequest.mockResolvedValueOnce(ok({ projects: full, hasMore: true })).mockResolvedValueOnce(ok({ projects: [{ id: 'last' }], hasMore: false }));
    const result = await niftyClient.listAll({ auth: testAuth(), path: 'projects', key: 'projects' });
    expect(result.items).toHaveLength(1001);
    expect(result.truncated).toBe(false);
    expect(sendRequest.mock.calls[0][0].queryParams).toEqual({ limit: '1000', offset: '0' });
    expect(sendRequest.mock.calls[1][0].queryParams).toEqual({ limit: '1000', offset: '1000' });
  });

  it('stops at the page cap and reports truncated', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ id: `p${i}` }));
    sendRequest.mockResolvedValue(ok({ projects: full, hasMore: true }));
    const result = await niftyClient.listAll({ auth: testAuth(), path: 'projects', key: 'projects', maxPages: 2 });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(result.truncated).toBe(true);
  });

  it('throws on an unexpected list shape instead of returning nothing', async () => {
    sendRequest.mockResolvedValueOnce(ok({ message: 'weird' }));
    await expect(niftyClient.listAll({ auth: testAuth(), path: 'projects', key: 'projects' })).rejects.toThrow('unexpected list response');
  });
});

describe('validators', () => {
  it('accepts Nifty IDs with ! and _ and rejects slashes and blanks', () => {
    expect(niftyClient.requireId({ value: ' jiA!cEfY03 ', label: 'Status ID' })).toBe('jiA!cEfY03');
    expect(niftyClient.segment('tk_O!179Q6')).toBe('tk_O!179Q6');
    expect(() => niftyClient.requireId({ value: 'a/b', label: 'Task ID' })).toThrow('not a valid Nifty ID');
    expect(() => niftyClient.requireId({ value: '  ', label: 'Task ID' })).toThrow('Task ID is required');
  });

  it('dedupes ID lists and splits comma text', () => {
    expect(niftyClient.idList({ value: ['a', 'b,a', ' c '], label: 'Member ID' })).toEqual(['a', 'b', 'c']);
    expect(niftyClient.idList({ value: undefined, label: 'Member ID' })).toEqual([]);
  });

  it('normalises dates to ISO and rejects junk', () => {
    expect(niftyClient.optionalIsoDate({ value: '2026-10-20', label: 'Due' })).toBe('2026-10-20T00:00:00.000Z');
    expect(() => niftyClient.optionalIsoDate({ value: 'next week', label: 'Due' })).toThrow('not a valid date');
  });

  it('validates number ranges', () => {
    expect(niftyClient.optionalNumber({ value: '5', label: 'Limit', min: 1, max: 1000, integer: true })).toBe(5);
    expect(() => niftyClient.optionalNumber({ value: 1.5, label: 'Limit', min: 1, max: 1000, integer: true })).toThrow('whole number');
    expect(() => niftyClient.optionalNumber({ value: 0, label: 'Limit', min: 1, max: 1000, integer: true })).toThrow('from 1 to 1000');
  });

  it('removes meeting passwords from projects', () => {
    expect(niftyClient.cleanProject({ id: 'p', zoom_password: 'x', webex_password: 'y', name: 'P' })).toEqual({ id: 'p', name: 'P' });
  });
});

describe('dropdowns', () => {
  it('portfolio dropdown explains a 403 instead of failing', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 403, body: { message: 'Forbidden resource' } }));
    const prop = niftyProps.portfolio({ required: false });
    const state = await prop.options({ auth: testAuth() }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' } });
    expect(state).toEqual({ disabled: true, placeholder: expect.stringContaining('Leave this empty'), options: [] });
  });

  it('project dropdown lists every page and filters by portfolio server-side', async () => {
    sendRequest.mockResolvedValueOnce(ok({ projects: [{ id: 'p1', name: 'One', subteam: 'pf' }, { id: 'p2', name: 'Two', subteam: 'other' }] }));
    const prop = niftyProps.project({ required: true });
    const state = await prop.options({ auth: testAuth(), portfolio: 'pf' }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' } });
    expect(sendRequest.mock.calls[0][0].queryParams).toEqual({ subteam_id: 'pf', limit: '1000', offset: '0' });
    expect(state.options).toEqual([{ label: 'One', value: 'p1' }]);
  });

  it('status dropdown asks for a project first', async () => {
    const prop = niftyProps.status({ required: true });
    const state = await prop.options({ auth: testAuth() }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' } });
    expect(state).toEqual({ disabled: true, placeholder: 'Select a project first', options: [] });
  });

  it('milestone dropdown keeps is_list=true and labels lists', async () => {
    sendRequest.mockResolvedValueOnce(
      ok({ items: [{ id: 'm1', name: 'Launch', is_list: false }, { id: 'l1', name: 'Backlog', is_list: true }], hasMore: false })
    );
    const prop = niftyProps.milestone({ required: false });
    const state = await prop.options({ auth: testAuth(), project: 'p1' }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' } });
    expect(sendRequest.mock.calls[0][0].queryParams).toMatchObject({ project_id: 'p1', is_list: 'true' });
    expect(state.options).toEqual([
      { label: 'Launch', value: 'm1' },
      { label: 'Backlog (list)', value: 'l1' },
    ]);
  });

  it('a failing dropdown shows the reason', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 401, body: { message: 'Unauthorized' } }));
    const prop = niftyProps.task({ required: true });
    const state = await prop.options({ auth: testAuth(), project: 'p1' }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' } });
    expect(state.disabled).toBe(true);
    expect(state.placeholder).toContain('Could not load tasks: Nifty did not accept the connection (401)');
  });
});
