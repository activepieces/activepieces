import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

const DEFAULT_API_VERSION = '2022.01';
const BASE_URL = 'https://api.clicdata.com';

export type ClicdataAuth =
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
        clientId: string;
        userEmail: string;
        userPassword: string;
      };
    };

type ClicdataApiSuccessResponse<TResult> = {
  success: true;
  result: TResult;
  pagination?: {
    result_count: number;
    result_total_count?: number;
    current_page: number;
    page_size: number;
    has_more_results?: boolean;
    last_page?: boolean;
  };
};

type ClicdataApiErrorResponse = {
  success: false;
  error: {
    code: string;
    description: string;
  };
};

type ClicdataApiResponse<TResult> =
  | ClicdataApiSuccessResponse<TResult>
  | ClicdataApiErrorResponse;

export type ClicdataApiCallParams = {
  method: HttpMethod;
  path: `/${string}`;
  auth: ClicdataAuth;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  apiVersion?: string;
};

function getHeadersFromAuth(auth: ClicdataAuth): Record<string, string> {
  if (auth.type === AppConnectionType.SECRET_TEXT) {
    return {
      'CLICDATA-API-KEY': auth.secret_text,
    };
  }

  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const encodedEmailAndPassword = Buffer.from(
      `${auth.props.userEmail}:${auth.props.userPassword}`
    ).toString('base64');
    const token = Buffer.from(
      `${auth.props.clientId}:${encodedEmailAndPassword}`
    ).toString('base64');

    return {
      Authorization: `Basic ${token}`,
    };
  }

  return {};
}

function getAuthentication(auth: ClicdataAuth) {
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

export async function clicdataApiCall<TResult>({
  method,
  path,
  auth,
  query,
  body,
  apiVersion,
}: ClicdataApiCallParams): Promise<ClicdataApiSuccessResponse<TResult>> {
  const queryParams: QueryParams = {
    api_version: apiVersion ?? DEFAULT_API_VERSION,
  };

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

  const response = await httpClient.sendRequest<ClicdataApiResponse<TResult>>(
    request
  );

  if (!response.body.success) {
    const errorMsg = response.body.error?.description ||
                     response.body.error?.code ||
                     'ClicData API error';
    throw new Error(errorMsg);
  }

  return response.body;
}
