import { createHash } from 'node:crypto';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { payfastApiBaseUrl } from './signature';

export type PayfastAuth = {
  merchant_id: string;
  merchant_key: string;
  passphrase: string;
  api_user?: string;
  api_password?: string;
  sandbox?: boolean;
};

/**
 * PayFast API requests use a "merchant-id" + "version" + "timestamp" + "signature" scheme.
 * Signature = MD5(querystring-of-params-with-passphrase).
 * Headers carry merchant-id and signature.
 */
export async function payfastApiRequest<T>(params: {
  auth: PayfastAuth;
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number>;
  body?: Record<string, unknown>;
}): Promise<T> {
  const { auth, method, path, query, body } = params;

  if (!auth.api_user || !auth.api_password) {
    throw new Error(
      'PayFast refunds and lookups require API User credentials. Add them to the connection.',
    );
  }

  const timestamp = new Date().toISOString();
  const headerParams: Record<string, string> = {
    'merchant-id': auth.merchant_id,
    version: 'v1',
    timestamp,
  };

  // For signature we also include the query params (PayFast requires this).
  const signatureInput: Record<string, string | number> = { ...headerParams };
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      signatureInput[k] = v;
    }
  }
  const signature = md5Signature(signatureInput, auth.passphrase);

  const request: HttpRequest = {
    method,
    url: `${payfastApiBaseUrl(!!auth.sandbox)}${path}`,
    headers: {
      'merchant-id': auth.merchant_id,
      version: 'v1',
      timestamp,
      signature,
    },
    queryParams: query
      ? Object.fromEntries(Object.entries(query).map(([k, v]) => [k, String(v)]))
      : undefined,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}

function md5Signature(
  params: Record<string, string | number>,
  passphrase: string,
): string {
  const parts = Object.entries(params).map(
    ([k, v]) => `${k}=${encodeURIComponent(String(v)).replace(/%20/g, '+')}`,
  );
  let s = parts.join('&');
  if (passphrase) {
    s += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  }
  return createHash('md5').update(s).digest('hex');
}
