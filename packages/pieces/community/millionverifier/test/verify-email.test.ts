import { httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyEmail } from '../src/lib/actions/verify-email';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('verifyEmail', () => {
  it('sends the request to api.millionverifier.com', async () => {
    const sendRequest = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { result: 'ok' } });

    await verifyEmail.run({
      ...createMockActionContext<typeof verifyEmail.props>({ propsValue: { email: 'test@example.com', timeout: 10 } }),
      auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'API_KEY_FOR_TEST' },
    });

    expect(sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://api.millionverifier.com/api/v3/?api=API_KEY_FOR_TEST&email=test%40example.com&timeout=10' }),
    );
  });
});
