/// <reference types="vitest/globals" />

import { toFailsafeOutput } from '../src';

describe('toFailsafeOutput', () => {
  it('keeps the cause code and message of a network error', () => {
    const cause = Object.assign(new Error('Connect Timeout Error (timeout: 10000ms)'), { code: 'UND_ERR_CONNECT_TIMEOUT' });
    const output = toFailsafeOutput({ error: new TypeError('fetch failed', { cause }), requestBody: undefined });
    expect(output.response).toEqual({ status: 0, body: 'fetch failed (UND_ERR_CONNECT_TIMEOUT: Connect Timeout Error (timeout: 10000ms))' });
  });

  it('returns the bare message when there is no cause', () => {
    const output = toFailsafeOutput({ error: new Error('boom'), requestBody: undefined });
    expect(output.response).toEqual({ status: 0, body: 'boom' });
  });
});
