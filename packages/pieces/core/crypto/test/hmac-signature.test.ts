/// <reference types="vitest/globals" />

import { hmacSignature } from '../src/lib/actions/hmac-signature';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('hmacSignature', () => {
  test('generates HMAC with SHA256 and UTF-8 key', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: 'mysecret',
        secretKeyEncoding: 'utf-8',
        method: 'SHA256',
        text: 'hello',
      },
    });
    const result = await hmacSignature.run(ctx);
    // Known HMAC-SHA256 of "hello" with key "mysecret"
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(64); // SHA256 hex digest is 64 chars
  });

  test('generates HMAC with MD5', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: 'key',
        secretKeyEncoding: 'utf-8',
        method: 'MD5',
        text: 'hello',
      },
    });
    const result = await hmacSignature.run(ctx);
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(32); // MD5 hex digest is 32 chars
  });

  test('generates HMAC with SHA512', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: 'key',
        secretKeyEncoding: 'utf-8',
        method: 'SHA512',
        text: 'hello',
      },
    });
    const result = await hmacSignature.run(ctx);
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(128); // SHA512 hex digest is 128 chars
  });

  test('generates HMAC with hex-encoded key', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: '6d79736563726574', // "mysecret" in hex
        secretKeyEncoding: 'hex',
        method: 'SHA256',
        text: 'hello',
      },
    });
    const result = await hmacSignature.run(ctx);
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(64);
  });
});
