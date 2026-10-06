import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveAuth } = vi.hoisted(() => ({
  resolveAuth: vi.fn<() => Promise<unknown>>(),
}));

vi.mock('../../../src/lib/common/token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/token')>();
  return { ...actual, resolveAuth };
});

const { httpClient } = await import('@activepieces/pieces-common');
const { customApiCall } = await import('../../../src/lib/actions/custom-api-call');

const sendRequest = vi.spyOn(httpClient, 'sendRequest');

const AUTH = { type: 'CUSTOM_AUTH', props: { keyFile: '{}', location: 'eu' } };
const ctx = (url: string) => ({ auth: AUTH, propsValue: { url: { url }, method: 'GET', headers: {}, queryParams: {} } }) as never;

beforeEach(() => {
  sendRequest.mockReset();
  resolveAuth.mockReset();
  resolveAuth.mockResolvedValue({ accessToken: 'ya29.secret', projectId: 'p', location: 'eu' });
  sendRequest.mockResolvedValue({ status: 200, headers: {}, body: {} });
});

describe('customApiCall', () => {
  it('should refuse an absolute URL on another host without minting or sending a token', async () => {
    await expect(customApiCall.run(ctx('https://attacker.example.com/v1/collect'))).rejects.toThrow(
      "only sends the connection's Google credentials to https://eu-documentai.googleapis.com, but the URL points to https://attacker.example.com"
    );
    await expect(customApiCall.run(ctx('https://us-documentai.googleapis.com/v1/projects/p/locations/us/processors'))).rejects.toThrow('points to https://us-documentai.googleapis.com');
    await expect(customApiCall.run(ctx('http://eu-documentai.googleapis.com/v1/x'))).rejects.toThrow('points to http://eu-documentai.googleapis.com');

    expect(resolveAuth).not.toHaveBeenCalled();
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('should send the token to an absolute URL on the connection host', async () => {
    await customApiCall.run(ctx('https://eu-documentai.googleapis.com/v1/projects/p/locations/eu/processors'));

    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://eu-documentai.googleapis.com/v1/projects/p/locations/eu/processors',
        headers: expect.objectContaining({ Authorization: 'Bearer ya29.secret' }),
      })
    );
  });

  it('should resolve a relative path against the connection host', async () => {
    await customApiCall.run(ctx('/v1/projects/p/locations/eu/processors'));

    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://eu-documentai.googleapis.com/v1/projects/p/locations/eu/processors',
        headers: expect.objectContaining({ Authorization: 'Bearer ya29.secret' }),
      })
    );
  });
});
