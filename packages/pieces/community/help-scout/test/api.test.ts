import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { HelpScoutApiError, helpScoutApi } from '../src/lib/common/api';

const auth = { access_token: 'token' };

function pageResponse({ ids, totalPages }: { ids: number[]; totalPages: number }) {
  return {
    status: 200,
    headers: {},
    body: { _embedded: { conversations: ids.map((id) => ({ id, _links: { self: 'x' } })) }, page: { totalPages } },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('helpScoutApi.request errors', () => {
  it('maps HttpError to HelpScoutApiError with status and responseBody, not body', async () => {
    const vendorBody = { message: 'Bad request.', _embedded: { errors: [{ path: 'customer', message: 'may not be empty.' }] } };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 400, responseBody: vendorBody }));
    const error = await helpScoutApi.request({ method: HttpMethod.GET, path: '/x', auth }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HelpScoutApiError);
    if (error instanceof HelpScoutApiError) {
      expect(error.status).toBe(400);
      expect(error.responseBody).toEqual(vendorBody);
      expect(error.message).toBe('Help Scout API error (400): Bad request; customer: may not be empty.');
      expect(Object.keys(error)).not.toContain('body');
    }
  });
  it('adds a hint for 404', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 404, responseBody: { message: 'Not found!' } }));
    await expect(helpScoutApi.request({ method: HttpMethod.GET, path: '/x', auth })).rejects.toThrow(
      'Help Scout API error (404): Not found. Check that the ID exists and the connected user can access it',
    );
  });
});

describe('duck-typed error mapping', () => {
  it('maps a plain object shaped like HttpError', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue({ response: { status: 422, body: { message: 'Invalid.' } } });
    const error = await helpScoutApi.request({ method: HttpMethod.GET, path: '/x', auth }).catch((e: unknown) => e);
    expect(helpScoutApi.isHelpScoutApiError(error)).toBe(true);
    expect(error).toMatchObject({ status: 422, responseBody: { message: 'Invalid.' } });
  });
  it('rethrows unrelated errors unchanged', async () => {
    const original = new Error('socket hang up');
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(original);
    await expect(helpScoutApi.request({ method: HttpMethod.GET, path: '/x', auth })).rejects.toBe(original);
  });
  it('recognises a foreign HelpScoutApiError-shaped object', () => {
    expect(helpScoutApi.isHelpScoutApiError({ name: 'HelpScoutApiError', status: 404 })).toBe(true);
    expect(helpScoutApi.isHelpScoutApiError({ name: 'Error', status: 404 })).toBe(false);
  });
});

describe('helpScoutApi.fetchPaged', () => {
  it('stops at the limit and reports truncated', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(pageResponse({ ids: [1, 2, 3], totalPages: 3 }))
      .mockResolvedValueOnce(pageResponse({ ids: [4, 5, 6], totalPages: 3 }));
    const result = await helpScoutApi.fetchPaged({ auth, path: '/conversations', embedKey: 'conversations', limit: 4 });
    expect(result.items.map((i) => i['id'])).toEqual([1, 2, 3, 4]);
    expect(result.truncated).toBe(true);
    expect(result.items[0]).not.toHaveProperty('_links');
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it('reports not truncated for an empty first page', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(pageResponse({ ids: [], totalPages: 0 }));
    const result = await helpScoutApi.fetchPaged({ auth, path: '/conversations', embedKey: 'conversations', limit: 50 });
    expect(result).toEqual({ items: [], truncated: false });
  });
  it('reports not truncated for an empty first page even when totalPages says 1', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(pageResponse({ ids: [], totalPages: 1 }));
    const result = await helpScoutApi.fetchPaged({ auth, path: '/conversations', embedKey: 'conversations', limit: 50 });
    expect(result.truncated).toBe(false);
  });
  it('does not fetch another page when the limit lands on a page boundary', async () => {
    const ids = (from: number) => Array.from({ length: 25 }, (_, i) => from + i);
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(pageResponse({ ids: ids(1), totalPages: 4 }))
      .mockResolvedValueOnce(pageResponse({ ids: ids(26), totalPages: 4 }));
    const result = await helpScoutApi.fetchPaged({ auth, path: '/conversations', embedKey: 'conversations', limit: 50 });
    expect(result.items).toHaveLength(50);
    expect(result.truncated).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it('stops at totalPages without truncation', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(pageResponse({ ids: [1], totalPages: 2 }))
      .mockResolvedValueOnce(pageResponse({ ids: [2], totalPages: 2 }));
    const result = await helpScoutApi.fetchPaged({ auth, path: '/conversations', embedKey: 'conversations', limit: 50 });
    expect(result.items).toHaveLength(2);
    expect(result.truncated).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('400 error details', () => {
  it('includes path, message and rejected value from _embedded.errors', () => {
    const message = helpScoutApi.extractVendorMessage({
      message: 'Bad request',
      _embedded: { errors: [{ path: 'sortField', message: "Expected one of these: 'createdAt'", rejectedValue: 'bogusField', source: 'query parameter' }] },
    });
    expect(message).toBe(`Bad request; sortField: Expected one of these: 'createdAt' rejected value "bogusField" in query parameter`);
  });
  it('describes errors without a message', () => {
    expect(helpScoutApi.extractVendorMessage({ message: 'Bad request', _embedded: { errors: [{ path: 'id', rejectedValue: '123' }] } }))
      .toBe('Bad request; id: invalid value rejected value "123"');
  });
});

describe('deleteConversationById', () => {
  it.each([400, 404])('maps a repeat delete %s to a clear message keeping status and responseBody', async (status) => {
    const vendorBody = { message: 'Bad request', _embedded: { errors: [null] } };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status, responseBody: vendorBody }));
    const error = await helpScoutApi.deleteConversationById({ auth, conversationId: 5 }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HelpScoutApiError);
    expect(error).toMatchObject({
      status,
      responseBody: vendorBody,
      message: `The conversation was not found or is already deleted (status ${status}).`,
    });
  });
  it('passes other errors through', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 403, responseBody: { message: 'Forbidden' } }));
    await expect(helpScoutApi.deleteConversationById({ auth, conversationId: 5 })).rejects.toMatchObject({ status: 403 });
  });
});

describe('stripLinksDeep', () => {
  it('removes nested _links in embedded threads', () => {
    expect(helpScoutApi.stripLinksDeep({ id: 1, _links: {}, _embedded: { threads: [{ id: 2, _links: {}, action: { type: 'x' } }] } }))
      .toEqual({ id: 1, _embedded: { threads: [{ id: 2, action: { type: 'x' } }] } });
  });
});

describe('helpScoutApi helpers', () => {
  it('encodes path ids and escapes query quotes', () => {
    expect(helpScoutApi.encodeId('12/../34')).toBe('12%2F..%2F34');
    expect(helpScoutApi.escapeQueryValue('a "b"')).toBe('a \\"b\\"');
  });
  it('throws when the Resource-ID header is missing', () => {
    expect(() => helpScoutApi.getResourceId({})).toThrow();
    expect(helpScoutApi.getResourceId({ 'resource-id': '99' })).toBe('99');
  });
});
