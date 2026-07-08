import { ApErrorParams, ErrorCode, isNil } from '@activepieces/core-utils';
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  HttpStatusCode,
  isAxiosError,
} from 'axios';
import qs from 'qs';

import { authenticationSession } from '@/lib/authentication-session';
import { chatDebug } from '@/lib/chat-debug-logger';
export const isRunningCloudInDevMode = import.meta.env.MODE === 'cloud';

export const API_BASE_URL = isRunningCloudInDevMode
  ? 'https://cloud.activepieces.com'
  : typeof window !== 'undefined'
  ? window.location.origin
  : '';
export const API_URL = `${API_BASE_URL}/api`;

const disallowedRoutes = [
  '/v1/managed-authn/external-token',
  '/v1/authentication/sign-in',
  '/v1/authentication/sign-up',
  '/v1/authn/local/verify-email',
  '/v1/authn/federated/login',
  '/v1/authn/federated/claim',
  '/v1/otp',
  '/v1/human-input',
  '/v1/authn/local/reset-password',
  '/v1/user-invitations/accept',
  '/v1/webhooks',
];
//This is important to avoid redirecting to sign-in page when the user is deleted for embedding scenarios
const ignroedGlobalErrorHandlerRoutes = ['/v1/users/me'];
function isUrlRelative(url: string) {
  return !url.startsWith('http') && !url.startsWith('https');
}

function globalErrorHandler(error: AxiosError) {
  if (api.isError(error)) {
    const errorCode: ErrorCode | undefined = (
      error.response?.data as { code: ErrorCode }
    )?.code;
    if (
      errorCode === ErrorCode.SESSION_EXPIRED ||
      errorCode === ErrorCode.INVALID_BEARER_TOKEN
    ) {
      authenticationSession.logOut();
      console.log(errorCode);
      window.location.href = '/sign-in';
    }
  }
}

function request<TResponse>(
  url: string,
  config: AxiosRequestConfig = {},
): Promise<TResponse> {
  const resolvedUrl = !isUrlRelative(url) ? url : `${API_URL}${url}`;
  const isApWebsite = resolvedUrl.startsWith(API_URL);
  const unAuthenticated = disallowedRoutes.some((route) =>
    resolvedUrl.replace(API_URL, '').startsWith(route),
  );

  const startedAt = performance.now();
  return axios({
    url: resolvedUrl,
    ...config,
    headers: {
      ...config.headers,
      Authorization: getToken(
        unAuthenticated,
        isApWebsite,
        authenticationSession.getToken(),
      ),
    },
  })
    .then((response) => {
      logChatHttp({
        url: resolvedUrl,
        config,
        startedAt,
        status: response.status,
      });
      return config.responseType === 'blob'
        ? response.data
        : (response.data as TResponse);
    })
    .catch((error) => {
      logChatHttp({
        url: resolvedUrl,
        config,
        startedAt,
        status: isAxiosError(error) ? error.response?.status : undefined,
        error,
      });
      if (
        isAxiosError(error) &&
        !ignroedGlobalErrorHandlerRoutes.includes(url)
      ) {
        globalErrorHandler(error);
      }
      throw error;
    });
}

// Mirrors chat HTTP calls into the debug logger so a chat run reconstructs
// from the request side too. Skips the ingest endpoint to avoid recursion.
function logChatHttp({
  url,
  config,
  startedAt,
  status,
  error,
}: {
  url: string;
  config: AxiosRequestConfig;
  startedAt: number;
  status?: number;
  error?: unknown;
}): void {
  if (!chatDebug.isEnabled()) return;
  const path = url.replace(API_URL, '');
  if (!path.startsWith('/v1/chat') || path.startsWith('/v1/logs')) return;
  const conversationId = path.match(/\/v1\/chat\/conversations\/([^/?]+)/)?.[1];
  const fields = {
    http: {
      method: (config.method ?? 'GET').toUpperCase(),
      path,
      status,
      durationMs: Math.round(performance.now() - startedAt),
    },
    ...(conversationId ? { conversation: { id: conversationId } } : {}),
  };
  if (error !== undefined) {
    chatDebug.error(
      {
        ...fields,
        error: error instanceof Error ? error.message : String(error),
      },
      'chat http request failed',
    );
  } else {
    chatDebug.info(fields, 'chat http request');
  }
}

function getToken(
  unAuthenticated: boolean,
  isApWebsite: boolean,
  token: string | null,
) {
  if (unAuthenticated || !isApWebsite) {
    return undefined;
  }
  if (isNil(token)) {
    return undefined;
  }
  return `Bearer ${token}`;
}

export type HttpError = AxiosError<unknown, AxiosResponse<unknown>>;

export const api = {
  isApError(error: unknown, errorCode: ErrorCode): error is HttpError {
    if (!isAxiosError(error)) {
      return false;
    }
    const responseData = error.response?.data as ApErrorParams;
    return responseData.code === errorCode;
  },
  isError(error: unknown): error is HttpError {
    return isAxiosError(error);
  },
  any: <TResponse>(url: string, config?: AxiosRequestConfig) =>
    request<TResponse>(url, config),
  get: <TResponse>(url: string, query?: unknown, config?: AxiosRequestConfig) =>
    request<TResponse>(url, {
      params: query,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          arrayFormat: 'repeat',
        });
      },
      ...config,
    }),
  delete: <TResponse>(
    url: string,
    query?: Record<string, string>,
    body?: unknown,
  ) =>
    request<TResponse>(url, {
      method: 'DELETE',
      params: query,
      data: body,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          arrayFormat: 'repeat',
        });
      },
    }),
  post: <TResponse, TBody = unknown, TParams = unknown>(
    url: string,
    body?: TBody,
    params?: TParams,
    headers?: Record<string, string>,
  ) =>
    request<TResponse>(url, {
      method: 'POST',
      data: body,
      headers: { 'Content-Type': 'application/json', ...headers },
      params: params,
    }),

  patch: <TResponse, TBody = unknown, TParams = unknown>(
    url: string,
    body?: TBody,
    params?: TParams,
  ) =>
    request<TResponse>(url, {
      method: 'PATCH',
      data: body,
      headers: { 'Content-Type': 'application/json' },
      params: params,
    }),
  httpStatus: HttpStatusCode,
};
