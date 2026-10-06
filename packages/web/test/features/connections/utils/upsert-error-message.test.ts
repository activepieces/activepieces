/**
 * @vitest-environment jsdom
 */
import { ErrorCode } from '@activepieces/core-utils';
import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { appConnectionUtils } from '@/features/connections/utils/utils';
import { NETWORK_ERROR_MESSAGE } from '@/lib/mutation-feedback';

vi.mock('i18next', () => ({
  t: (key: string, params: Record<string, string> = {}) =>
    key.replace(/\{(\w+)\}/g, (_match, name: string) => params[name] ?? ''),
}));

function httpError({ data }: { data: unknown }): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config,
  });
}

describe('appConnectionUtils.upsertErrorMessage', () => {
  it('explains a network failure instead of throwing on the missing response', () => {
    const offline = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(appConnectionUtils.upsertErrorMessage(offline)).toBe(
      NETWORK_ERROR_MESSAGE,
    );
  });

  it('shows the server text for a validation error', () => {
    const error = httpError({
      data: {
        code: ErrorCode.VALIDATION,
        params: { message: 'Name is too long' },
      },
    });
    expect(appConnectionUtils.upsertErrorMessage(error)).toBe(
      'Validation error: Name is too long',
    );
  });

  it('falls back to the server message for an unknown code', () => {
    const error = httpError({
      data: { code: 'SOMETHING_ELSE', params: { message: 'Quota reached' } },
    });
    expect(appConnectionUtils.upsertErrorMessage(error)).toBe('Quota reached');
  });
});
