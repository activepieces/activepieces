import {
  AuthenticationType,
  HttpHeaders,
  HttpMethod,
  HttpResponse,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import type { MattermostAuthValue } from './types';

function baseUrl({ auth }: { auth: MattermostAuthValue }): string {
  return `${auth.props.workspace_url.replace(/\/$/, '')}/api/v4`;
}

async function send<T>({
  auth,
  method,
  path,
  query,
  body,
  headers,
  redactBodyInErrors,
}: RequestParams & { auth: MattermostAuthValue }): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl({ auth })}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.props.token,
    },
    headers,
    queryParams: query,
    body,
    redactBodyInErrors,
  });
}

async function request<T>(params: RequestParams & { auth: MattermostAuthValue }): Promise<T> {
  const response = await send<T>(params);
  return response.body;
}

async function download({
  auth,
  path,
  query,
}: DownloadParams & { auth: MattermostAuthValue }): Promise<MattermostDownload> {
  const response = await httpClient.sendRequest<ArrayBuffer>({
    method: HttpMethod.GET,
    url: `${baseUrl({ auth })}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.props.token,
    },
    queryParams: query,
    responseType: 'arraybuffer',
  });
  const contentType = response.headers?.['content-type'];
  const disposition = response.headers?.['content-disposition'];
  return {
    data: Buffer.from(response.body),
    contentType: typeof contentType === 'string' ? contentType : undefined,
    fileName: fileNameFromDisposition({
      disposition: typeof disposition === 'string' ? disposition : undefined,
    }),
  };
}

function fileNameFromDisposition({
  disposition,
}: {
  disposition: string | undefined;
}): string | undefined {
  if (!disposition) {
    return undefined;
  }
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded) {
    return decodeURIComponent(encoded[1]);
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : undefined;
}

export const mattermostClient = { baseUrl, send, request, download };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: HttpHeaders;
  redactBodyInErrors?: boolean;
};

type DownloadParams = {
  path: string;
  query?: QueryParams;
};

type MattermostDownload = {
  data: Buffer;
  contentType: string | undefined;
  fileName: string | undefined;
};
