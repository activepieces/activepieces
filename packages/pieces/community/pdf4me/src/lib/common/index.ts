import { httpClient, HttpMethod, HttpMessageBody, HttpResponse } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.pdf4me.com';

async function callFileApi({
  apiKey,
  endpoint,
  body,
}: {
  apiKey: string;
  endpoint: string;
  body: Record<string, unknown>;
}): Promise<HttpResponse<ArrayBuffer>> {
  return httpClient.sendRequest<ArrayBuffer>({
    method: HttpMethod.POST,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body,
    responseType: 'arraybuffer',
  });
}

async function callJsonApi<T extends HttpMessageBody>({
  apiKey,
  endpoint,
  body,
}: {
  apiKey: string;
  endpoint: string;
  body: Record<string, unknown>;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body,
  });
}

function fileNameFromHeaders(
  headers: Record<string, string | string[] | undefined> | undefined,
  fallback: string,
): string {
  const raw = headers?.['content-disposition'] ?? headers?.['Content-Disposition'];
  const cd = Array.isArray(raw) ? raw[0] : (raw ?? '');
  const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(cd);
  if (!match) return fallback;
  return match[1].replace(/['"]/g, '').trim() || fallback;
}

export const pdf4meCommon = { BASE_URL, callFileApi, callJsonApi, fileNameFromHeaders };
