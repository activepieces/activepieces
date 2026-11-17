import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VapiApiError, vapiApi, vapiUtils } from '../src/lib/common/vapi-api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('vapiApi.request', () => {
  it('sends a bearer request to the Vapi base URL and drops empty query values', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: [] });
    await vapiApi.request({
      apiKey: ' key-123 ',
      method: HttpMethod.GET,
      path: '/call',
      operation: 'list calls',
      query: { limit: 5, assistantId: undefined, phoneNumberId: '' },
    });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.GET,
        url: 'https://api.vapi.ai/call',
        headers: { Authorization: 'Bearer key-123', Accept: 'application/json' },
        queryParams: { limit: '5' },
      })
    );
  });

  it('maps an HTTP error with an array message to a readable error carrying responseBody', async () => {
    const body = { message: ['customer.number must be E.164', 'assistantId must be a UUID'], error: 'Bad Request', statusCode: 400 };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 400, responseBody: body }));
    const promise = vapiApi.request({ apiKey: 'k', method: HttpMethod.POST, path: '/call', operation: 'create call', body: {} });
    await expect(promise).rejects.toBeInstanceOf(VapiApiError);
    await expect(promise).rejects.toMatchObject({
      message: 'Vapi create call failed (400): customer.number must be E.164; assistantId must be a UUID',
      status: 400,
      responseBody: body,
    });
  });

  it('says a write may have been applied on a transport error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(
      vapiApi.request({ apiKey: 'k', method: HttpMethod.POST, path: '/call', operation: 'create call', body: {} })
    ).rejects.toThrow('Vapi create call failed: socket hang up. The change may still have been applied');
  });

  it('does not claim a read may have been applied on a transport error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(
      vapiApi.request({ apiKey: 'k', method: HttpMethod.GET, path: '/call', operation: 'list calls' })
    ).rejects.toThrow(/^Vapi list calls failed: socket hang up\.$/);
  });
});

describe('vapiUtils', () => {
  it('strips secrets and headers recursively', () => {
    const result = vapiUtils.stripSecrets({
      id: 't1',
      server: { url: 'https://x.test', secret: 's', headers: { Authorization: 'x' } },
      twilioAuthToken: 'tok',
      nested: [{ apiKey: 'a', keep: 1 }],
    });
    expect(result).toEqual({ id: 't1', server: { url: 'https://x.test' }, nested: [{ keep: 1 }] });
  });

  it('drops presigned links and webCallUrl but keeps recording URLs', () => {
    const result = vapiUtils.stripSecrets({
      webCallUrl: 'https://w.test/x?sig=1',
      artifact: {
        recordingUrl: 'https://r.test/a.wav',
        stereoRecordingUrl: 'https://r.test/s.wav',
        presignedMonoUrl: 'https://r2.test/m?X-Amz-Signature=1',
        presignedStereoUrl: 'x',
        presignedAssistantUrl: 'x',
        presignedCustomerUrl: 'x',
        presignedLogUrl: 'x',
      },
    });
    expect(result).toEqual({ artifact: { recordingUrl: 'https://r.test/a.wav', stereoRecordingUrl: 'https://r.test/s.wav' } });
  });

  it('rejects IDs that could change the request path', () => {
    expect(() => vapiUtils.requireId({ value: '../assistant', fieldName: 'Call ID' })).toThrow('Call ID must be a Vapi ID');
    expect(vapiUtils.requireId({ value: ' abc-123 ', fieldName: 'Call ID' })).toBe('abc-123');
  });

  it('parses JSON objects and refuses arrays', () => {
    expect(vapiUtils.parseJsonObject({ value: '{"a":1}', fieldName: 'X' })).toEqual({ a: 1 });
    expect(vapiUtils.parseJsonObject({ value: '', fieldName: 'X' })).toBeUndefined();
    expect(() => vapiUtils.parseJsonObject({ value: '[1]', fieldName: 'X' })).toThrow('X must be a JSON object');
    expect(() => vapiUtils.parseJsonObject({ value: '{bad', fieldName: 'X' })).toThrow('X must be a valid JSON object');
  });

  it('clamps limits and rejects non-integers', () => {
    expect(vapiUtils.clampLimit({ value: undefined, defaultValue: 20, max: 100 })).toBe(20);
    expect(vapiUtils.clampLimit({ value: 500, defaultValue: 20, max: 100 })).toBe(100);
    expect(() => vapiUtils.clampLimit({ value: 0, defaultValue: 20, max: 100 })).toThrow();
    expect(() => vapiUtils.clampLimit({ value: 2.5, defaultValue: 20, max: 100 })).toThrow();
  });
});
