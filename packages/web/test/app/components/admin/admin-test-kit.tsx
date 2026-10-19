import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import * as React from 'react';
import { vi } from 'vitest';

function httpError({ status, data }: { status: number; data: unknown }) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
}

function serverError(message: string) {
  return httpError({ status: 400, data: { params: { message } } });
}

function quotaError() {
  return httpError({
    status: 402,
    data: { code: 'QUOTA_EXCEEDED', params: { metric: 'users' } },
  });
}

function queryWrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function interpolate(key: string, vars?: Record<string, unknown>): string {
  return key.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars?.[name] === undefined ? match : String(vars[name]),
  );
}

export const toastMock = { success: vi.fn(), error: vi.fn() };

export const i18nextMock = { t: interpolate };

export const adminTestKit = {
  serverError,
  quotaError,
  queryWrapper,
};
