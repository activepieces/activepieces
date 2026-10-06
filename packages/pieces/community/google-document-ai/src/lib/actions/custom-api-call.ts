import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { googleDocumentAiAuth } from '../auth';
import { API_VERSION, apiRoot } from '../common/client';
import { connectionLocation, normalizeLocation, resolveAuth } from '../common/token';

function requestedUrl(propsValue: unknown): string {
  if (!isRecord(propsValue)) return '';
  const urlProp = propsValue['url'];
  if (!isRecord(urlProp)) return '';
  const url = urlProp['url'];
  return typeof url === 'string' ? url : '';
}

function assertConnectionHost({ url, root }: { url: string; root: string }): void {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;
  const origin = originOf(url);
  if (origin === new URL(root).origin) return;
  throw new Error(
    `Custom API Call only sends the connection's Google credentials to ${root}, but the URL points to ${origin ?? 'an invalid address'}. Use a path such as /${API_VERSION}/projects/{project}/locations/{location}/processors, or a full URL on ${root}.`
  );
}

function originOf(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export const customApiCall = createCustomApiCallAction({
  auth: googleDocumentAiAuth,
  baseUrl: (auth) => {
    try {
      return apiRoot(normalizeLocation(connectionLocation(auth)));
    } catch {
      return apiRoot('us');
    }
  },
  description: `Call any Document AI endpoint on the connection's regional host (https://<location>-documentai.googleapis.com). Paths must include the version, e.g. /${API_VERSION}/projects/{project}/locations/{location}/processors, /${API_VERSION}/projects/{project}/locations/{location}/processors/{id}:batchProcess, /${API_VERSION}/{operationName}.`,
  authMapping: async (auth, propsValue) => {
    assertConnectionHost({ url: requestedUrl(propsValue), root: apiRoot(normalizeLocation(connectionLocation(auth))) });
    const { accessToken } = await resolveAuth(auth);
    return { Authorization: `Bearer ${accessToken}` };
  },
});
