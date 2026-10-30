import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { signQuery } from './signature';

export type HibiraAuthProps = {
  appId: string;
  key: string;
  secret: string;
  pushInstanceId?: string;
  pushSecretKey?: string;
  baseUrl?: string;
};

type AuthValue = { props: HibiraAuthProps } | HibiraAuthProps;

function props(auth: AuthValue): HibiraAuthProps {
  return 'props' in auth ? auth.props : auth;
}

function baseUrl(auth: HibiraAuthProps): string {
  return (auth.baseUrl || 'https://ws.hibira.io').trim().replace(/\/+$/, '');
}

/** Splits a comma or newline separated list, dropping empty entries. */
export function splitList(value: string | string[] | undefined): string[] {
  const list = Array.isArray(value) ? value : String(value ?? '').split(/[,\n]/);
  return list.map((s) => String(s).trim()).filter((s) => s !== '');
}

export const hibiraClient = {
  /** Signed request to the app's Channels HTTP API (/apps/{appId}{path}). */
  async channels<T = Record<string, unknown>>(
    auth: AuthValue,
    {
      method,
      path,
      query = {},
      body,
    }: { method: 'GET' | 'POST' | 'DELETE'; path: string; query?: Record<string, string>; body?: unknown },
  ): Promise<T> {
    const a = props(auth);
    const fullPath = `/apps/${encodeURIComponent(a.appId)}${path}`;
    const raw = body === undefined ? undefined : JSON.stringify(body);
    const queryParams = signQuery({ key: a.key, secret: a.secret, method, path: fullPath, query, body: raw });
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod[method],
      url: baseUrl(a) + fullPath,
      queryParams,
      headers: raw === undefined ? {} : { 'Content-Type': 'application/json' },
      body: raw,
    });
    return response.body;
  },

  /** Request to the Beams-compatible push API, with {instance} filled in. */
  async push<T = Record<string, unknown>>(
    auth: AuthValue,
    { method, path, body }: { method: 'POST' | 'DELETE'; path: string; body?: unknown },
  ): Promise<T> {
    const a = props(auth);
    if (!a.pushInstanceId || !a.pushSecretKey) {
      throw new Error('Add the Push Instance ID and Push Secret Key to the connection to send push notifications.');
    }
    const response = await httpClient.sendRequest<T>({
      method: HttpMethod[method],
      url: baseUrl(a) + path.replace('{instance}', encodeURIComponent(a.pushInstanceId)),
      headers: { Authorization: `Bearer ${a.pushSecretKey}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (response.body ?? {}) as T;
  },
};
