import { AppConnectionType } from '@activepieces/pieces-framework';
import { Fathom, HTTPClient } from 'fathom-typescript';
import { FathomAuthValue } from './auth';
import { FathomApiError, fathomClient } from './client';

function createSdk({ auth }: { auth: FathomAuthValue }): FathomSdk {
  const failures: Failure[] = [];
  const httpClient = new HTTPClient();
  httpClient.addHook('response', async (response) => {
    if (response.ok) {
      return;
    }
    const text = await response.clone().text().catch(() => '');
    failures.push({ status: response.status, responseBody: parseBody(text) });
  });
  const security = auth.type === AppConnectionType.SECRET_TEXT ? { apiKeyAuth: auth.secret_text.trim() } : { bearerAuth: auth.access_token };
  const sdk = new Fathom({
    security,
    httpClient,
    timeoutMs: 60000,
    retryConfig: {
      strategy: 'backoff',
      backoff: { initialInterval: 5000, maxInterval: 20000, exponent: 1.5, maxElapsedTime: 45000 },
      retryConnectionErrors: false,
    },
  });
  function requireResult<T>({ value, operation }: { value: T | undefined | null; operation: string }): T {
    if (value !== undefined && value !== null) {
      return value;
    }
    const failure = failures[failures.length - 1];
    if (failure === undefined) {
      throw new Error(`Fathom returned no data for ${operation}. Try again; if it keeps happening, reconnect your Fathom account.`);
    }
    throw new FathomApiError({ ...failure, message: fathomClient.errorMessage(failure) });
  }
  return { sdk, requireResult };
}

function parseBody(text: string): unknown {
  if (text.length === 0) {
    return '';
  }
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return text;
  }
}

export const fathomSdk = { create: createSdk };

type Failure = { status: number; responseBody: unknown };
export type FathomSdk = {
  sdk: Fathom;
  requireResult: <T>(args: { value: T | undefined | null; operation: string }) => T;
};
