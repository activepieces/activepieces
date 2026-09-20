/// <reference types="vitest/globals" />

import { httpClient } from '@activepieces/pieces-common';
import { deliverSubflowResponse } from '../src/lib/common';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: vi.fn() } };
});

const sendRequest = vi.mocked(httpClient.sendRequest);

describe('deliverSubflowResponse', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  test('posts the response to the callback url', async () => {
    sendRequest.mockResolvedValue({ status: 200, body: { message: 'recorded', expired: false } });

    await deliverSubflowResponse({ callbackUrl: 'https://host/resume', response: { ok: true } });

    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(sendRequest.mock.calls[0][0]).toMatchObject({
      url: 'https://host/resume',
      body: { status: 'success', data: { ok: true } },
    });
  });

  test('throws when the caller is no longer waiting, so the drop is not reported as success', async () => {
    sendRequest.mockResolvedValue({ status: 200, body: { message: 'expired', expired: true } });

    await expect(
      deliverSubflowResponse({ callbackUrl: 'https://host/resume', response: { ok: true } })
    ).rejects.toThrow(/no longer waiting for a response/);
  });

  test('stays silent when the acknowledgement carries no expiry marker (older server)', async () => {
    sendRequest.mockResolvedValue({ status: 200, body: {} });

    await expect(
      deliverSubflowResponse({ callbackUrl: 'https://host/resume', response: { ok: true } })
    ).resolves.toBeUndefined();
  });
});
