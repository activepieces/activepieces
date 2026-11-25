/**
 * @vitest-environment jsdom
 */
import { EDITOR_SESSION_ID_HEADER } from '@activepieces/shared';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosRequest = vi.hoisted(() =>
  vi.fn<(config: AxiosRequestConfig) => Promise<unknown>>(),
);
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: axiosRequest };
});

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getToken: () => 'token', logOut: vi.fn() },
}));

vi.mock('i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('i18next')>()),
  t: (key: string) => key,
}));

vi.mock('@/lib/chat-debug-logger', () => ({
  chatDebug: { isEnabled: () => false },
}));

import { api } from '@/lib/api';
import { editorSession } from '@/lib/editor-session';

describe('the Editor Session id on API requests', () => {
  beforeEach(() => {
    axiosRequest.mockReset();
    axiosRequest.mockResolvedValue({ status: 200, data: {} });
  });

  it('sends the Editor Session id of the page load on every API request', async () => {
    await api.get('/v1/flows');
    await api.post('/v1/flows/flow-1', { type: 'CHANGE_NAME' });
    await api.delete('/v1/flows/flow-1');

    const sentIds = axiosRequest.mock.calls.map(
      ([config]) => config.headers?.[EDITOR_SESSION_ID_HEADER],
    );
    expect(sentIds).toEqual([
      editorSession.getId(),
      editorSession.getId(),
      editorSession.getId(),
    ]);
  });

  it('keeps the Editor Session id off a request to a third-party URL', async () => {
    await api.get('https://registry.npmjs.org/lodash');

    const [[config]] = axiosRequest.mock.calls;
    expect(config.headers).not.toHaveProperty(EDITOR_SESSION_ID_HEADER);
  });
});

describe('api.extractServerErrorMessage', () => {
  const fallback = 'fallback';

  function httpError(status?: number, data?: unknown): AxiosError {
    const response =
      status === undefined ? undefined : ({ status, data } as AxiosResponse);
    return new AxiosError(
      `Request failed with status code ${status}`,
      undefined,
      undefined,
      undefined,
      response,
    );
  }

  function apError(status: number, code: string, message?: string) {
    return httpError(status, { code, params: message ? { message } : {} });
  }

  it.each([
    [
      'network failure',
      httpError(),
      "Couldn't reach the server. Check your connection and try again.",
    ],
    [
      '403 with an allowlisted reason',
      apError(403, 'AUTHORIZATION', 'Only custom pieces can be deleted'),
      'Only custom pieces can be deleted',
    ],
    [
      '403 with other text',
      apError(403, 'AUTHORIZATION', 'not owned by current project'),
      "You don't have permission to do this.",
    ],
    [
      '404',
      httpError(404, { message: 'Route GET:/v1/x not found' }),
      'It no longer exists. Refresh the page and try again.',
    ],
    [
      '402 generic feature disabled',
      apError(402, 'FEATURE_DISABLED', 'Feature is disabled'),
      "Your plan doesn't include this feature.",
    ],
    [
      '400 Fastify validation',
      httpError(400, { code: 'FST_ERR_VALIDATION', message: 'body/x must be' }),
      "Some values aren't valid. Check them and try again.",
    ],
    [
      '413 other Fastify error',
      httpError(413, {
        code: 'FST_ERR_CTP_BODY_TOO_LARGE',
        message: 'Request body is too large',
      }),
      'Request body is too large',
    ],
    ['500', httpError(500, { message: 'db exploded' }), fallback],
  ])('%s', (_, error, expected) => {
    expect(api.extractServerErrorMessage(error, fallback)).toBe(expected);
  });
});
