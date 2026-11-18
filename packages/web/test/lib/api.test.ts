/**
 * @vitest-environment jsdom
 */
import { EDITOR_SESSION_ID_HEADER } from '@activepieces/shared';
import { AxiosRequestConfig } from 'axios';
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
