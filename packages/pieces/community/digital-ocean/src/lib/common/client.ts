import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

const BASE_URL = 'https://api.digitalocean.com/v2';

export type DigitalOceanAuth =
  | {
      type:
        | AppConnectionType.OAUTH2
        | AppConnectionType.CLOUD_OAUTH2
        | AppConnectionType.PLATFORM_OAUTH2;
      access_token: string;
    }
  | {
      type: AppConnectionType.SECRET_TEXT;
      secret_text: string;
    };

export type DigitalOceanApiCallParams = {
  method: HttpMethod;
  path: `/${string}`;
  auth: DigitalOceanAuth;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

function getAccessToken(auth: DigitalOceanAuth): string {
  switch (auth.type) {
    case AppConnectionType.OAUTH2:
    case AppConnectionType.CLOUD_OAUTH2:
    case AppConnectionType.PLATFORM_OAUTH2:
      return auth.access_token;
    case AppConnectionType.SECRET_TEXT:
      return auth.secret_text;
  }
}

export function getAuthFromValue(auth: unknown): DigitalOceanAuth {
  if (typeof auth === 'string') {
    return {
      type: AppConnectionType.SECRET_TEXT,
      secret_text: auth,
    };
  }
  const authObj = auth as { access_token?: string; type?: string };
  if (authObj.access_token) {
    return {
      type: AppConnectionType.OAUTH2,
      access_token: authObj.access_token,
    };
  }
  throw new Error('Invalid authentication value');
}

export async function digitalOceanApiCall<TResult>({
  method,
  path,
  auth,
  query,
  body,
}: DigitalOceanApiCallParams): Promise<TResult> {
  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: getAccessToken(auth),
    },
    headers: {
      'Content-Type': 'application/json',
    },
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    body,
  };

  const response = await httpClient.sendRequest<TResult>(request);
  return response.body;
}
