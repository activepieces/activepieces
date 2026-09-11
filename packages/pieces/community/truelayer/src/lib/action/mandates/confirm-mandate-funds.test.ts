import { HttpMethod, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmMandateFunds } from './confirm-mandate-funds';

function resp(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

let sendRequest: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('confirm_mandate_funds', () => {
  it('sends amount_in_minor and currency as query params, not as a GET body', async () => {
    sendRequest.mockResolvedValue(resp({ status: 'authorized' }));

    await confirmMandateFunds.run({
      auth: { access_token: 'tok' },
      propsValue: {
        id: 'mandate-1',
        amount_in_minor: '100',
        currency: 'GBP',
      },
    } as never);

    const req = sendRequest.mock.calls[0][0] as HttpRequest;
    expect(req.method).toBe(HttpMethod.GET);
    expect(req.url).toContain('/v3/mandates/mandate-1/funds');
    expect(req.queryParams).toEqual({ amount_in_minor: '100', currency: 'GBP' });
    expect(req.body).toBeUndefined();
  });
});
