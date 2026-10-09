/// <reference types="vitest/globals" />

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', () => ({
  AuthenticationType: {
    BEARER_TOKEN: 'BEARER_TOKEN',
  },
  HttpMethod: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
  },
  httpClient: {
    sendRequest: (...args: unknown[]) => sendRequest(...args),
  },
}));

import { HttpMethod } from '@activepieces/pieces-common';
import { kickcallClient } from '../src/lib/common/client';
import { KICKCALL_BASE_URL } from '../src/lib/common/constants';

const auth = {
  props: {
    apiKey: 'test-api-key',
    email: 'biz@example.com',
  },
};

const lastRequest = () => sendRequest.mock.calls.at(-1)?.[0];

function reply(body: unknown) {
  sendRequest.mockResolvedValueOnce({ body, status: 200 });
}

describe('marketplaceRequest', () => {
  beforeEach(() => sendRequest.mockReset());

  test('posts marketplace body with apiKey injected', async () => {
    reply({ ok: true });
    await kickcallClient.marketplaceRequest({
      auth,
      path: '/api/v1/marketplace/outbound_calls',
      body: {
        location_id: '1',
        agent_id: '2',
        to_number: '+15551234567',
      },
    });

    expect(lastRequest()).toMatchObject({
      method: HttpMethod.POST,
      url: `${KICKCALL_BASE_URL}/api/v1/marketplace/outbound_calls`,
      body: {
        location_id: '1',
        agent_id: '2',
        to_number: '+15551234567',
        apiKey: 'test-api-key',
      },
    });
  });

  test('posts interaction lookup body with apiKey injected', async () => {
    reply({ id: 50428 });
    await kickcallClient.marketplaceRequest({
      auth,
      path: '/api/v1/marketplace/interactions',
      body: {
        location_id: '1',
        agent_id: '2',
        interaction_id: '50428',
      },
    });

    expect(lastRequest().body).toEqual({
      location_id: '1',
      agent_id: '2',
      interaction_id: '50428',
      apiKey: 'test-api-key',
    });
  });
});

describe('bearerRequestAllPages', () => {
  beforeEach(() => sendRequest.mockReset());

  test('walks pages until meta.total_pages is reached', async () => {
    reply({
      data: [{ id: 1 }],
      meta: { total_pages: 2 },
    });
    reply({
      data: [{ id: 2 }],
      meta: { total_pages: 2 },
    });

    await expect(
      kickcallClient.bearerRequestAllPages({
        auth,
        path: '/api/v1/business/locations',
      }),
    ).resolves.toEqual({
      data: [{ id: 1 }, { id: 2 }],
    });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[0]?.[0].queryParams).toMatchObject({
      page: '1',
      per_page: '100',
    });
    expect(sendRequest.mock.calls[1]?.[0].queryParams).toMatchObject({
      page: '2',
    });
  });

  test('stops on a short page when meta is missing', async () => {
    reply({
      data: Array.from({ length: 100 }, (_, index) => ({ id: index })),
    });
    reply({
      data: [{ id: 100 }],
    });

    const result = await kickcallClient.bearerRequestAllPages({
      auth,
      path: '/api/v1/business/locations/1/agents',
      queryParams: { per_page: '100' },
    });

    expect(result.data).toHaveLength(101);
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });
});
