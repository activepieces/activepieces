import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

const BASE_URL = 'https://api.gotenzo.com/v1.0';

export type TenzoAuth =
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
    }
  | {
      type: AppConnectionType.CUSTOM_AUTH;
      props: {
        appId: string;
        apiSecret: string;
      };
    };

export type TenzoApiCallParams = {
  method: HttpMethod;
  path: `/${string}`;
  auth: TenzoAuth;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

function getHeadersFromAuth(auth: TenzoAuth): Record<string, string> {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return {
      Authorization: `Token ${auth.secret_text}`,
    };
  }

  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return {
      'X-APP-ID': auth.props.appId,
      'X-API-SECRET': auth.props.apiSecret,
    };
  }

  return {};
}

function getAuthentication(auth: TenzoAuth) {
  switch (auth.type) {
    case AppConnectionType.OAUTH2:
    case AppConnectionType.CLOUD_OAUTH2:
    case AppConnectionType.PLATFORM_OAUTH2:
      return {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      } as const;
    case AppConnectionType.SECRET_TEXT:
    case AppConnectionType.CUSTOM_AUTH:
      return undefined;
  }
}

export async function tenzoApiCall<TResult>({
  method,
  path,
  auth,
  query,
  body,
}: TenzoApiCallParams): Promise<TResult> {
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
    authentication: getAuthentication(auth),
    headers: {
      'Content-Type': 'application/json',
      ...getHeadersFromAuth(auth),
    },
    queryParams,
    body,
  };

  const response = await httpClient.sendRequest<TResult>(request);

  return response.body;
}
