import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { elevenlabsAuth } from './auth';
import { getApiKey, getRegionApiUrl } from './common';

type ElevenlabsAuth = AppConnectionValueForAuthProperty<typeof elevenlabsAuth>;

type QueryValue = string | number | boolean | undefined | null;

async function request<T>({ auth, method, path, queryParams, body, formData }: RequestParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${getRegionApiUrl(auth.props.region)}${path}`,
      headers: {
        'xi-api-key': getApiKey(auth),
        ...(formData ? formData.getHeaders() : {}),
      },
      queryParams: toQuery({ params: queryParams }),
      body: formData ?? body,
    });
    return response.body;
  } catch (error) {
    throw new Error(describeError({ error }));
  }
}

async function download({ auth, method, path, queryParams, body, formData }: DownloadParams): Promise<DownloadedFile> {
  try {
    const response = await httpClient.sendRequest<ArrayBuffer>({
      method,
      url: `${getRegionApiUrl(auth.props.region)}${path}`,
      headers: {
        'xi-api-key': getApiKey(auth),
        ...(formData ? formData.getHeaders() : {}),
      },
      queryParams: toQuery({ params: queryParams }),
      body: formData ?? body,
      responseType: 'arraybuffer',
    });
    const contentType = response.headers?.['content-type'];
    return {
      data: Buffer.from(response.body),
      contentType: typeof contentType === 'string' ? contentType : 'application/octet-stream',
    };
  } catch (error) {
    throw new Error(describeError({ error }));
  }
}

function compact({ values }: { values: Record<string, unknown> }): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function toQuery({ params }: { params?: Record<string, QueryValue> }): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params ?? {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function describeError({ error }: { error: unknown }): string {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error.message : 'ElevenLabs request failed';
  }
  const status = error.response.status;
  const detail = readDetail({ body: error.response.body });
  const hint = status === 401 || status === 403 ? ' (check the API key permissions for this endpoint)' : status === 404 ? ' (not found)' : status === 429 ? ' (rate limited)' : '';
  return `ElevenLabs API error ${status}: ${detail}${hint}`;
}

function readDetail({ body }: { body: unknown }): string {
  if (typeof body !== 'object' || body === null || !('detail' in body)) {
    return typeof body === 'string' ? body : JSON.stringify(body);
  }
  const detail = body.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (typeof detail === 'object' && detail !== null && 'message' in detail && typeof detail.message === 'string') {
    return detail.message;
  }
  return JSON.stringify(detail);
}

function extensionFor({ contentType }: { contentType: string }): string {
  if (contentType.includes('zip')) return 'zip';
  if (contentType.includes('wav')) return 'wav';
  if (contentType.includes('mpeg') || contentType.includes('mp3')) return 'mp3';
  if (contentType.includes('mp4')) return 'mp4';
  if (contentType.includes('json')) return 'json';
  return 'bin';
}

export const elevenlabsClient = { request, download, compact, extensionFor };

type RequestParams = {
  auth: ElevenlabsAuth;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, QueryValue>;
  body?: Record<string, unknown>;
  formData?: FormData;
};

type DownloadParams = {
  auth: ElevenlabsAuth;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, QueryValue>;
  body?: Record<string, unknown>;
  formData?: FormData;
};

type DownloadedFile = { data: Buffer; contentType: string };
