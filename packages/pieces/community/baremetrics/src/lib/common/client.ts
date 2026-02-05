import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

export type BaremetricsAuth =
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

export type BaremetricsApiCallParams = {
  method: HttpMethod;
  path: `/${string}`;
  auth: BaremetricsAuth;
  body?: unknown;
};

function getAuthentication(auth: BaremetricsAuth) {
  switch (auth.type) {
    case AppConnectionType.OAUTH2:
    case AppConnectionType.CLOUD_OAUTH2:
    case AppConnectionType.PLATFORM_OAUTH2:
      return {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      } as const;
    case AppConnectionType.SECRET_TEXT:
      return {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      } as const;
  }
}

export async function baremetricsApiCall<TResult>({
  method,
  path,
  auth,
  body,
}: BaremetricsApiCallParams): Promise<TResult> {
  const request: HttpRequest = {
    method,
    url: `https://api.baremetrics.com/v1${path}`,
    authentication: getAuthentication(auth),
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  };

  const response = await httpClient.sendRequest<TResult>(request);
  return response.body;
}