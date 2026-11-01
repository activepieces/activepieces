import { describe, expect, it, vi, afterEach } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { FireberryClient, fireberryUtils } from '../src/lib/common/client';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FireberryClient errors', () => {
  it('surfaces the capital-M Message with status and responseBody', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 400, responseBody: { Message: 'Invalid query syntax' } }),
    );
    const error = await new FireberryClient('t').request({ method: HttpMethod.GET, resourceUri: '/x' }).catch((e: unknown) => e);
    expect(error).toMatchObject({
      message: 'Fireberry API error (400): Invalid query syntax',
      status: 400,
      responseBody: { Message: 'Invalid query syntax' },
    });
    expect(error).not.toHaveProperty('body');
  });

  it('falls back to lowercase message and raw body', async () => {
    expect(fireberryUtils.extractVendorMessage({ message: 'lower' })).toBe('lower');
    expect(fireberryUtils.extractVendorMessage('{"Message":"json string"}')).toBe('json string');
    expect(fireberryUtils.extractVendorMessage({ other: 1 })).toBeUndefined();
  });

  it('treats success:false in a 200 body as an error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { success: false, message: 'nope' } });
    await expect(new FireberryClient('t').getObjectsMetadata()).rejects.toMatchObject({ status: 200, message: expect.stringContaining('nope') });
  });

  it('does not retry a single-record create on 5xx', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 503, responseBody: 'down' }));
    await expect(new FireberryClient('t').createRecord({ objectSystemName: 'Account', record: { accountname: 'A' } })).rejects.toMatchObject({ status: 503 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('retries idempotent GETs on 429', async () => {
    vi.useFakeTimers();
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(new HttpError({}, { status: 429, responseBody: {} }))
      .mockResolvedValue({ status: 200, headers: {}, body: { success: true, data: [] } });
    const promise = new FireberryClient('t').getObjectsMetadata();
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual([]);
    expect(spy).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('rate limits and record lookups', () => {
  it('does not retry a 429 on create and says it is a rate limit', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 429, responseBody: { Message: 'Too Many Requests' } }));
    await expect(new FireberryClient('t').createRecord({ objectSystemName: 'Account', record: { accountname: 'A' } })).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining('rate limit reached (429): Too Many Requests'),
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('turns a 400 on get-record into a not-found-or-deleted message that keeps vendor text', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 400, responseBody: { Message: 'internal error' } }));
    await expect(new FireberryClient('t').getRecord({ objectSystemName: 'Account', recordId: 'g1' })).rejects.toMatchObject({
      status: 400,
      message: expect.stringMatching(/not found or has been deleted.*internal error/),
    });
  });
});

describe('message formatting', () => {
  it('trims trailing punctuation from the vendor message so no ".." appears', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 429, responseBody: { Message: 'Too Many Requests. ' } }));
    const error = await new FireberryClient('t').createRecord({ objectSystemName: 'Account', record: {} }).catch((e: unknown) => e);
    expect(error).toMatchObject({ message: expect.stringContaining('(429): Too Many Requests. Fireberry limits') });
    expect(String(Reflect.get(Object(error), 'message'))).not.toContain('..');
  });
});

describe('buildQueryBody', () => {
  it('builds a full body', () => {
    expect(
      fireberryUtils.buildQueryBody({ objectType: 1, fields: ['a', ' b ', ''], query: " (x = 'y') ", sortBy: 'modifiedon', sortType: 'asc', pageSize: 50, pageNumber: 10 }),
    ).toEqual({ objecttype: 1, fields: 'a,b', query: "(x = 'y')", sort_by: 'modifiedon', sort_type: 'asc', page_size: 50, page_number: 10 });
  });

  it('rejects out-of-range paging instead of clamping', () => {
    expect(() => fireberryUtils.buildQueryBody({ objectType: 1, pageSize: 51 })).toThrow('Page size');
    expect(() => fireberryUtils.buildQueryBody({ objectType: 1, pageNumber: 11 })).toThrow('Page number');
  });
});

describe('toRecordResult', () => {
  it('reads a single-record data.Record envelope', () => {
    expect(fireberryUtils.toRecordResult({ body: { success: true, data: { Record: { contactid: 'c9' } } }, objectSystemName: 'Contact' }).id).toBe('c9');
  });

  it('extracts the id from the first batch record', () => {
    expect(fireberryUtils.toRecordResult({ body: { success: true, data: [{ accountid: 'g1', accountname: 'A' }] }, objectSystemName: 'Account' })).toEqual({
      id: 'g1',
      objectSystemName: 'Account',
      record: { accountid: 'g1', accountname: 'A' },
    });
  });

  it('uses the fallback id when none is present', () => {
    expect(fireberryUtils.toRecordResult({ body: {}, objectSystemName: 'Account', fallbackId: 'x' }).id).toBe('x');
  });
});
