import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  HttpStatusCode,
  isAxiosError,
} from 'axios';
import qs from 'qs';

import { authenticationSession } from '@/lib/authentication-session';
import { ErrorCode } from '@activepieces/shared';

export const API_BASE_URL =
  import.meta.env.MODE === 'cloud'
    ? 'https://cloud.activepieces.com'
    : window.location.origin;
export const API_URL = `${API_BASE_URL}/api`;

const disallowedRoutes = [
  '/v1/managed-authn/external-token',
  '/v1/authentication/sign-in',
  '/v1/authentication/sign-up',
  '/v1/authn/local/verify-email',
  '/v1/flags',
  '/v1/authn/federated/login',
  '/v1/authn/federated/claim',
  '/v1/otp',
  '/v1/human-input',
  '/v1/authn/local/reset-password',
  '/v1/user-invitations/accept',
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
    url.startsWith(route),
  );
  return axios({
    url: resolvedUrl,
    ...config,
    headers: {
      ...config.headers,
      Authorization:
        unAuthenticated || !isApWebsite
          ? undefined
          : `Bearer ${authenticationSession.getToken()}`,
    },
  })
    .then((response) =>
      config.responseType === 'blob'
        ? response.data
        : (response.data as TResponse),
    )
    .catch((error) => {
      if (
        isAxiosError(error) &&
        !ignroedGlobalErrorHandlerRoutes.includes(url)
      ) {
        globalErrorHandler(error);
      }
      throw error;
    });
}

export type HttpError = AxiosError<unknown, AxiosResponse<unknown>>;

export const api = {
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
