import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  isAxiosError,
} from 'axios';
import qs from 'qs';

import { authenticationSession } from '@/lib/authentication-session';

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
  '/v1/forms/',
  '/v1/authn/local/reset-password',
  '/v1/user-invitations/accept',
];

function isUrlRelative(url: string) {
  return !url.startsWith('http') && !url.startsWith('https');
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
  }).then((response) => response.data as TResponse);
}

export type HttpError = AxiosError<unknown, AxiosResponse<unknown>>;

export const api = {
  isError(error: unknown): error is HttpError {
    return isAxiosError(error);
  },
  get: <TResponse>(url: string, query?: unknown) =>
    request<TResponse>(url, {
      params: query,
      paramsSerializer: (params) => {
        return qs.stringify(params, {
          arrayFormat: 'repeat',
        });
      },
    }),
  delete: <TResponse>(url: string, query?: Record<string, string>) =>
    request<TResponse>(url, {
      method: 'DELETE',
      params: query,
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
};
