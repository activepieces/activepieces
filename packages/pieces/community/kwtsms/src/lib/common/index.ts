// 2026-11-16 +03: kwtSMS API client for the piece. Why: one place for credentials, errors and the sender ID dropdown.
import { AppConnectionType } from '@activepieces/pieces-framework';

export const KWTSMS_BASE_URL = 'https://www.kwtsms.com/API';

export type KwtsmsCredentials = { username: string; password: string };
export type KwtsmsAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: KwtsmsCredentials;
};

type ErrorBody = { result?: string; code?: string; description?: string };

/**
 * POST a JSON body to a kwtSMS endpoint. Errors (HTTP 4XX with {result:"ERROR",code,description}) throw "ERRxxx: description".
 * 2026-11-16 16:28 +03: plain fetch instead of httpClient: httpClient logs the full request body on any HTTP error,
 * and the kwtSMS API takes the username and password in that body, so they would land in the worker logs.
 */
export async function callKwtsms<T = Record<string, unknown>>(
  endpoint: string,
  creds: KwtsmsCredentials,
  params: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`${KWTSMS_BASE_URL}/${endpoint}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username: creds.username, password: creds.password, ...params }),
  });
  const text = await res.text();
  let body: (ErrorBody & Record<string, unknown>) | undefined;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`kwtSMS returned HTTP ${res.status} without JSON`);
  }
  if (body?.result === 'ERROR' || !res.ok) {
    throw new Error(`${body?.code ?? `HTTP ${res.status}`}: ${body?.description ?? 'kwtSMS error'}`);
  }
  return body as T;
}
