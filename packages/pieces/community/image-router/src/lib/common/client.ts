import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import type { ImageRouterAuthValue } from './types';

function baseUrl(): string {
  return BASE_URL;
}

async function request<T>({ auth, method, path, body }: RequestParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${auth.secret_text}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

async function upload<T>({ auth, path, form }: UploadParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method: HttpMethod.POST,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.secret_text,
    },
    headers: {
      ...form.getHeaders(),
    },
    body: form,
  });
  return response.body;
}

async function download({ url }: { url: string }): Promise<Buffer> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url,
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.body);
}

export const imageRouterClient = { baseUrl, request, upload, download };

const BASE_URL = 'https://api.imagerouter.io';

type RequestParams = {
  auth: ImageRouterAuthValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
};

type UploadParams = {
  auth: ImageRouterAuthValue;
  path: string;
  form: FormData;
};
