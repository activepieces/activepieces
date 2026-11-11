import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { klaviyoAuth } from '../src/lib/common/auth';
import { klaviyoTransport } from '../src/lib/common/client';

function stub({ status, body, network }: { status: number; body?: unknown; network?: boolean }): void {
  vi.spyOn(klaviyoTransport, 'getDispatcher').mockResolvedValue({});
  vi.stubGlobal('fetch', async () => {
    if (network) {
      throw new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } });
    }
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
}

async function validate(): Promise<{ valid: boolean; error?: string }> {
  const variant = klaviyoAuth[0];
  if (variant.type !== PropertyType.SECRET_TEXT || variant.validate === undefined) {
    throw new Error('klaviyoAuth[0] is not the API key auth with validate');
  }
  return variant.validate({ auth: 'pk_x', server: { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/' } });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('klaviyo auth validate', () => {
  test('200 is valid', async () => {
    stub({ status: 200, body: { data: [] } });
    expect(await validate()).toEqual({ valid: true });
  });

  test('401 says invalid API key', async () => {
    stub({ status: 401, body: { errors: [{ detail: 'Incorrect authentication credentials.' }] } });
    const result = await validate();
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid API key');
  });

  test('403 names the missing accounts:read scope and the vendor detail', async () => {
    stub({ status: 403, body: { errors: [{ detail: 'You do not have permission to perform this action.' }] } });
    const result = await validate();
    expect(result.error).toContain('accounts:read');
    expect(result.error).toContain('You do not have permission');
    expect(result.error).not.toContain('Invalid API key');
  });

  test('500 reports the status and vendor text', async () => {
    stub({ status: 500, body: { errors: [{ detail: 'Internal error' }] } });
    const result = await validate();
    expect(result.error).toContain('HTTP 500');
    expect(result.error).toContain('Internal error');
  });

  test('network failure reports the transport reason', async () => {
    stub({ status: 0, network: true });
    const result = await validate();
    expect(result.error).toContain('ECONNREFUSED');
    expect(result.error).not.toContain('Invalid API key');
  });

  test('oauth scopes include metrics:read and tags:write', () => {
    const variant = klaviyoAuth[1];
    if (variant.type !== PropertyType.OAUTH2) {
      throw new Error('klaviyoAuth[1] is not OAuth2');
    }
    expect(variant.scope).toEqual(expect.arrayContaining(['metrics:read', 'tags:write', 'accounts:read']));
  });
});
