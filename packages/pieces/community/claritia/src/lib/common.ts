import { getAccessTokenOrThrow, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const CLARITIA_BASE = 'https://app.tryclaritia.com';
export const CLARITIA_API = `${CLARITIA_BASE}/api/v1`;

export type HookBody = {
  id: string;
  event: string;
  test?: boolean;
  data?: { fill?: Record<string, unknown>; meeting?: Record<string, unknown>; lead?: Record<string, unknown> };
};

/** The one object a step maps from: the fill, meeting or lead, with the event's name and id. */
export const itemOf = (b: HookBody) => ({
  ...(b.data?.fill ?? b.data?.meeting ?? b.data?.lead ?? {}),
  event: b.event,
  event_id: b.id,
  test: !!b.test,
});

export async function claritiaCall<T>(
  auth: OAuth2PropertyValue | undefined,
  method: HttpMethod,
  path: string,
  body?: object,
  query?: Record<string, string>
): Promise<T> {
  const r = await httpClient.sendRequest<T>({
    method,
    url: `${CLARITIA_API}${path}`,
    headers: { Authorization: `Bearer ${getAccessTokenOrThrow(auth)}` },
    body,
    queryParams: query,
  });
  return r.body;
}
