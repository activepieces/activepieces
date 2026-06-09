/// <reference types="vitest/globals" />
import { httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { createSubscriberAction } from './create-subscriber';
import { vi, describe, it, expect, afterEach } from 'vitest';

describe('createSubscriberAction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should send a POST request with the correct payload', async () => {
    const sendRequestSpy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      body: {
        id: 'sub_123',
        email: 'test@example.com',
        first_name: 'John',
        status: 'active',
      },
    } as any);

    const mockContext = createMockActionContext({
      propsValue: {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        status: 'active',
        segments: ['seg_123'],
        double_optin: true,
      },
    });

    const context = {
      ...mockContext,
      auth: {
        secret_text: 'test_api_key',
      },
    } as any;

    const result = await createSubscriberAction.run(context);

    expect(sendRequestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.flodesk.com/v1/subscribers',
        headers: {
          'Authorization': 'Basic dGVzdF9hcGlfa2V5Og==',
          'Content-Type': 'application/json',
          'User-Agent': 'Activepieces (https://www.activepieces.com)',
        },
        body: {
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          status: 'active',
          segment_ids: ['seg_123'],
          double_optin: true,
        },
      })
    );

    expect(result).toEqual({
      id: 'sub_123',
      email: 'test@example.com',
      first_name: 'John',
      status: 'active',
    });
  });
});
