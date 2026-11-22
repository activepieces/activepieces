import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JoggAiError, joggAiClient } from '../src/lib/common/client';

function mockBody({ body }: { body: unknown }) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('joggAiClient.request', () => {
  it('unwraps data on code 0 and sends the api key header', async () => {
    const spy = mockBody({ body: { code: 0, msg: 'Success', data: { remaining_quota: 42 } } });
    const data = await joggAiClient.request({
      apiKey: ' key ',
      method: HttpMethod.GET,
      path: '/v2/user/remaining_quota',
      op: 'get quota',
    });
    expect(data).toEqual({ remaining_quota: 42 });
    const sent = spy.mock.calls[0][0];
    expect(sent.url).toBe('https://api.jogg.ai/v2/user/remaining_quota');
    expect(sent.headers?.['x-api-key']).toBe('key');
  });

  it('maps a non-zero envelope code to a readable error', async () => {
    mockBody({ body: { code: 10105, msg: 'Invalid API key' } });
    const promise = joggAiClient.request({ apiKey: 'k', method: HttpMethod.GET, path: '/x', op: 'list voices' });
    await expect(promise).rejects.toThrow('JoggAI list voices failed (10105): Invalid API key');
    await expect(promise).rejects.toBeInstanceOf(JoggAiError);
  });

  it('includes the vendor message for known codes with extra detail', async () => {
    mockBody({ body: { code: 40000, msg: 'template_id is required' } });
    await expect(
      joggAiClient.request({ apiKey: 'k', method: HttpMethod.POST, path: '/x', op: 'create', body: {} })
    ).rejects.toThrow('JoggAI create failed (40000): Parameter error - template_id is required');
  });

  it('maps HTTP errors and keeps the vendor body out of the message fields', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 404, responseBody: '404 page not found' })
    );
    const error = await joggAiClient
      .request({ apiKey: 'k', method: HttpMethod.GET, path: '/x', op: 'get video' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(JoggAiError);
    expect(error instanceof Error ? error.message : '').toBe('JoggAI get video failed (HTTP 404): 404 page not found');
  });

  it('warns that a POST may have been applied on a transport error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(
      joggAiClient.request({ apiKey: 'k', method: HttpMethod.POST, path: '/x', op: 'create video', body: {} })
    ).rejects.toThrow(/could not reach the JoggAI API \(socket hang up\)\. The request may still have been applied/);
  });

  it('does not add the applied warning on GET transport errors', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('timeout'));
    const error = await joggAiClient
      .request({ apiKey: 'k', method: HttpMethod.GET, path: '/x', op: 'get' })
      .catch((e: unknown) => e);
    expect(error instanceof Error ? error.message : '').not.toContain('may still have been applied');
  });

  it('rejects non-numeric ids', () => {
    expect(() => joggAiClient.toIntegerId({ value: 'abc', label: 'Avatar ID' })).toThrow('Avatar ID must be a numeric');
    expect(joggAiClient.toIntegerId({ value: ' 12 ', label: 'Avatar ID' })).toBe(12);
  });
});
