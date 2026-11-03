import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  httpClient,
  QueryParams,
} from '@activepieces/pieces-common';
import type { MattermostAuthValue } from './types';

function baseUrl({ auth }: { auth: MattermostAuthValue }): string {
  return `${auth.props.workspace_url.replace(/\/$/, '')}/api/v4`;
}

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams & { auth: MattermostAuthValue }): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${baseUrl({ auth })}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.props.token,
      },
      queryParams: query,
      body,
    });
    return response.body;
  } catch (e) {
    if (e instanceof HttpError && e.response.status === 403) {
      throw new Error(
        'Please make sure you have the correct bot token and channel ID.'
      );
    }
    throw e;
  }
}

export const mattermostClient = { baseUrl, request };

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
};
