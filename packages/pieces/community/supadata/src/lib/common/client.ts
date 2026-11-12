import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { supadataConfig } from '../config';

async function request({ apiKey, method, path, query, body }: RequestParams): Promise<unknown> {
  const queryString = buildQueryString({ query });
  try {
    const response = await httpClient.sendRequest({
      method,
      url: `${supadataConfig.baseUrl}${path}${queryString}`,
      headers: {
        [supadataConfig.accessTokenHeaderKey]: apiKey,
      },
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(`Supadata API error (${error.response.status}): ${extractMessage({ body: error.response.body })}`);
    }
    throw error;
  }
}

function buildQueryString({ query }: { query?: QueryInput }): string {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }
    params.append(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

function extractMessage({ body }: { body: unknown }): string {
  if (typeof body === 'string') {
    return body;
  }
  if (typeof body === 'object' && body !== null) {
    const message = 'message' in body ? body.message : undefined;
    const details = 'details' in body ? body.details : undefined;
    return [message, details].filter((part): part is string => typeof part === 'string').join(' - ');
  }
  return 'Unknown error';
}

export const supadataClient = { request, GET: HttpMethod.GET, POST: HttpMethod.POST };

type QueryInput = Record<string, string | number | boolean | string[] | undefined | null>;

type RequestParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  query?: QueryInput;
  body?: Record<string, unknown>;
};
