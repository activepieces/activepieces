import { httpClient } from '@activepieces/pieces-common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { googleDocumentAi } from '../../../src/index';

describe('custom API call', () => {
  const sendRequest = vi.spyOn(httpClient, 'sendRequest');
  const customApiCall = googleDocumentAi.actions()['custom_api_call'];
  const ctx = (url: string) => ({ auth: { type: 'OAUTH2', access_token: 'ya29.secret', props: { projectId: 'p', location: 'eu' } }, propsValue: { url: { url }, method: 'GET', headers: {}, queryParams: {} } }) as never;

  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: {} });
  });

  it('should refuse an absolute URL on another host without sending a token', async () => {
    await expect(customApiCall.run(ctx('https://attacker.example.com/v1/collect'))).rejects.toThrow(
      "only sends the connection's Google credentials to https://eu-documentai.googleapis.com, but the URL points to https://attacker.example.com"
    );
    await expect(customApiCall.run(ctx('https://us-documentai.googleapis.com/v1/projects/p/locations/us/processors'))).rejects.toThrow('points to https://us-documentai.googleapis.com');

    expect(sendRequest).not.toHaveBeenCalled();
  });

  it.each(['https://eu-documentai.googleapis.com/v1/projects/p/locations/eu/processors', '/v1/projects/p/locations/eu/processors'])('should send the token to %s on the connection host', async (url) => {
    await customApiCall.run(ctx(url));

    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://eu-documentai.googleapis.com/v1/projects/p/locations/eu/processors',
        headers: expect.objectContaining({ Authorization: 'Bearer ya29.secret' }),
      })
    );
  });
});
