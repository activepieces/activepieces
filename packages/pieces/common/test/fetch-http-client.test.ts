/// <reference types="vitest/globals" />

import { afterEach, expect, test, vi } from 'vitest';
import { FetchHttpClient } from '../src/lib/http/core/fetch-http-client';
import { HttpMethod } from '../src/lib/http/core/http-method';

afterEach(() => {
  vi.restoreAllMocks();
});

test('serializes form-urlencoded arrays as repeated bracketed keys', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
  const client = new FetchHttpClient();

  await client.sendRequest({
    method: HttpMethod.POST,
    url: 'https://api.stripe.com/v1/webhook_endpoints',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: {
      enabled_events: ['refund.created', 'charge.refunded'],
      url: 'https://example.com/webhook',
    },
  });

  expect(fetchSpy).toHaveBeenCalledTimes(1);
  const call = fetchSpy.mock.calls[0];

  if (!call) {
    throw new Error('expected fetch to be called');
  }

  const init = call[1];
  const body = init?.body;

  if (typeof body !== 'string') {
    throw new Error('expected a serialized string body');
  }

  const params = new URLSearchParams(body);

  expect(params.getAll('enabled_events[]')).toEqual(['refund.created', 'charge.refunded']);
  expect(params.get('url')).toBe('https://example.com/webhook');
});
