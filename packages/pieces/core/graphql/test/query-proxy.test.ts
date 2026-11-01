/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { query } from '../src/lib/actions/query';

const { requestSpy } = vi.hoisted(() => ({
  requestSpy: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ request: requestSpy })),
  },
}));

beforeEach(() => {
  requestSpy.mockReset();
  requestSpy.mockResolvedValue({ data: { ok: true } });
});

describe('proxy branch sends the GraphQL request', () => {
  test('maps the request to an axios config', async () => {
    const result = await query.run(
      createMockActionContext({
        propsValue: {
          method: HttpMethod.POST,
          url: 'https://api.example.com/graphql',
          use_proxy: true,
          proxy_settings: { proxy_host: 'proxy.local', proxy_port: 8080 },
          queryParams: { a: '1' },
          headers: { Authorization: 'Bearer t' },
          query: '{ ok }',
          variables: { id: 1 },
        },
      }),
    );

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.POST,
        url: 'https://api.example.com/graphql',
        params: { a: '1' },
        data: '{"query":"{ ok }","variables":{"id":1}}',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer t',
        }),
      }),
    );
    expect(result).toEqual({ ok: true });
  });
});
