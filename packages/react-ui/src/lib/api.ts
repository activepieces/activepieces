import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  isAxiosError,
} from 'axios';
import qs from 'qs';

import { authenticationSession } from '@/lib/authentication-session';
const apiUrl = 'https://cloud.activepieces.com/api';

const disallowedRoutes = [
  '/v1/authentication/sign-in',
  '/v1/authentication/sign-up',
  '/v1/flags',
  '/v1/authn/federated/login',
  '/v1/authn/federated/claim',
  '/v1/otp',
  '/v1/authn/local/reset-password',
];

function request<TResponse>(
  url: string,
  config: AxiosRequestConfig = {},
): Promise<TResponse> {
  return axios({
    url: `${apiUrl}${url}`,
    ...config,
    headers: {
      ...config.headers,
      Authorization: disallowedRoutes.includes(url)
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
  delete: <TResponse>(url: string) =>
    request<TResponse>(url, { method: 'DELETE' }),
  post: <TResponse, TBody = unknown>(url: string, body?: TBody) =>
    request<TResponse>(url, {
      method: 'POST',
      data: body,
      headers: { 'Content-Type': 'application/json' },
    }),
};
