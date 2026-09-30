import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';

async function request<T>({
  auth,
  method,
  path,
  queryParams,
  body,
}: WooRequestParams): Promise<T> {
  const baseUrl = auth.baseUrl.replace(/\/$/, '');
  const { data, error } = await tryCatch(() =>
    httpClient.sendRequest<T>({
      method,
      url: `${baseUrl}/wp-json/wc/v3${path}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.consumerKey,
        password: auth.consumerSecret,
      },
      queryParams: dropEmpty(queryParams),
      body,
    })
  );
  if (error) {
    throw toWooError(error);
  }
  return data.body;
}

function dropEmpty(queryParams: WooQueryParams | undefined): QueryParams {
  const result: QueryParams = {};
  if (!queryParams) {
    return result;
  }
  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = String(value);
    }
  }
  return result;
}

function toWooError(error: Error): Error {
  if (!(error instanceof HttpError)) {
    return error;
  }
  const status = error.response.status;
  const body = readWooErrorBody(error.response.body);
  const detail = `WooCommerce returned ${status}${body.code ? ` (${body.code})` : ''}`;
  const message = body.message ?? '';
  if (status === 401) {
    return new Error(
      `${detail}: authentication failed. Check that the consumer key and secret are valid, that the key has Read/Write permission, and that the store is reached over HTTPS. ${message}`.trim()
    );
  }
  if (status === 403) {
    return new Error(
      `${detail}: the API key's user is not allowed to perform this operation. ${message}`.trim()
    );
  }
  if (status === 404) {
    return new Error(
      `${detail}: the requested resource was not found; check the id. ${message}`.trim()
    );
  }
  if (status === 410) {
    return new Error(
      `${detail}: the resource is already in the trash. Pass permanent=true to delete it for good. ${message}`.trim()
    );
  }
  if (body.resourceId !== undefined) {
    return new Error(
      `${detail}: ${message} Existing resource id: ${body.resourceId}.`
    );
  }
  return new Error(message ? `${detail}: ${message}` : detail);
}

function readWooErrorBody(body: unknown): WooErrorBody {
  if (typeof body !== 'object' || body === null) {
    return {};
  }
  const record: Record<string, unknown> = Object(body);
  const data: Record<string, unknown> =
    typeof record['data'] === 'object' && record['data'] !== null
      ? Object(record['data'])
      : {};
  const resourceId = data['resource_id'];
  return {
    code: typeof record['code'] === 'string' ? record['code'] : undefined,
    message:
      typeof record['message'] === 'string' ? record['message'] : undefined,
    resourceId:
      typeof resourceId === 'number' || typeof resourceId === 'string'
        ? resourceId
        : undefined,
  };
}

function encodeId(id: string | number): string {
  return encodeURIComponent(String(id).trim());
}

export const wooClient = {
  request,
  encodeId,
};

export type WooAuthProps = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

export type WooQueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

type WooRequestParams = {
  auth: WooAuthProps;
  method: HttpMethod;
  path: string;
  queryParams?: WooQueryParams;
  body?: unknown;
};

type WooErrorBody = {
  code?: string;
  message?: string;
  resourceId?: number | string;
};
