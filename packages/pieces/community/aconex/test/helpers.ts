import { httpClient, type HttpRequest } from '@activepieces/pieces-common';
import type { Store } from '@activepieces/pieces-framework';
import { resetAconexForTests, setAconexThrottleForTests } from '../src/lib/client';
import { PRODUCTION_LOBBY, type AconexAuthProps } from '../src/lib/auth-props';

export const productionAuth: AconexAuthProps = {
  lobby: PRODUCTION_LOBBY,
  clientId: 'client-id',
  clientSecret: 'client-secret',
};

export const authServer = {
  apiUrl: 'http://localhost',
  publicUrl: 'http://localhost',
  mintOidcToken: async () => 'unused',
};

export function connection(props: AconexAuthProps = productionAuth) {
  return { type: 'CUSTOM_AUTH' as const, props };
}

export function prepareAconexTest(): void {
  resetAconexForTests();
  setAconexThrottleForTests({ minGapMs: 0, sleep: async () => undefined });
}

export function memoryStore(initial: Record<string, unknown> = {}): Store {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? (data.get(key) as T) : null;
    },
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

export function tokenBody() {
  return { status: 200, headers: {}, body: { access_token: 'token-1', token_type: 'Bearer', expires_in: 3600 } };
}

export function xmlBody(body: string) {
  return { status: 200, headers: {}, body };
}

export function mockHttp(
  handler: (request: HttpRequest) => Promise<{ status: number; headers: Record<string, string>; body: unknown }> | { status: number; headers: Record<string, string>; body: unknown },
) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    if (String(request.url).includes('/auth/token')) {
      return tokenBody();
    }
    return handler(request);
  });
}
