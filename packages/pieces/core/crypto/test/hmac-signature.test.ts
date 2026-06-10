/// <reference types="vitest/globals" />

import { hmacSignature } from '../src/lib/actions/hmac-signature';
import { createMockActionContext } from '@activepieces/pieces-framework';

describe('hmacSignature', () => {
  test('generates HMAC with SHA256 and UTF-8 key (hex output)', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: 'mysecret',
        secretKeyEncoding: 'utf-8' as const,
        method: 'sha256',
        text: 'hello',
        outputEncoding: 'hex' as const,
      },
    });
    const result = await hmacSignature.run(ctx);
    expect(typeof result).toBe('string');
    // SHA256 hex digest is always 64 chars
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });

  test('generates HMAC with MD5 (hex output)', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: 'key',
        secretKeyEncoding: 'utf-8' as const,
        method: 'md5',
        text: 'hello',
        outputEncoding: 'hex' as const,
      },
    });
    const result = await hmacSignature.run(ctx);
    expect(typeof result).toBe('string');
    // MD5 hex digest is always 32 chars
    expect(result).toHaveLength(32);
  });

  test('generates HMAC with SHA512 (hex output)', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: 'key',
        secretKeyEncoding: 'utf-8' as const,
        method: 'sha512',
        text: 'hello',
        outputEncoding: 'hex' as const,
      },
    });
    const result = await hmacSignature.run(ctx);
    expect(typeof result).toBe('string');
    // SHA512 hex digest is always 128 chars
    expect(result).toHaveLength(128);
  });

  test('generates HMAC with hex-encoded key', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: '6d79736563726574', // "mysecret" in hex
        secretKeyEncoding: 'hex' as const,
        method: 'sha256',
        text: 'hello',
        outputEncoding: 'hex' as const,
      },
    });
    const result = await hmacSignature.run(ctx);
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(64);
  });

  test('generates HMAC with SHA256 and base64 output', async () => {
    const ctx = createMockActionContext({
      propsValue: {
        secretKey: 'mysecret',
        secretKeyEncoding: 'utf-8' as const,
        method: 'sha256',
        text: 'hello',
        outputEncoding: 'base64' as const,
      },
    });
    const result = await hmacSignature.run(ctx);
    expect(typeof result).toBe('string');
    // SHA256 produces 32 bytes → base64 is 44 chars
    expect(result).toHaveLength(44);
    expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  test('base64 and hex outputs decode to the same bytes', async () => {
    const hexCtx = createMockActionContext({
      propsValue: {
        secretKey: 'twitter_consumer_secret&',
        secretKeyEncoding: 'utf-8' as const,
        method: 'sha256',
        text: 'crc_token_value',
        outputEncoding: 'hex' as const,
      },
    });
    const b64Ctx = createMockActionContext({
      propsValue: {
        secretKey: 'twitter_consumer_secret&',
        secretKeyEncoding: 'utf-8' as const,
        method: 'sha256',
        text: 'crc_token_value',
        outputEncoding: 'base64' as const,
      },
    });

    const hexResult = await hmacSignature.run(hexCtx);
    const b64Result = await hmacSignature.run(b64Ctx);

    expect(Buffer.from(b64Result as string, 'base64').toString('hex')).toBe(hexResult);
  });
});
