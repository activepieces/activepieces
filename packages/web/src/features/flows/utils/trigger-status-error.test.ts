import { describe, expect, it } from 'vitest';

import { triggerStatusErrorUtils } from './trigger-status-error';

const { describeStandardError } = triggerStatusErrorUtils;

describe('triggerStatusErrorUtils.describeStandardError', () => {
  it('pulls the plain message out of a serialized piece error', () => {
    const standardError = JSON.stringify({
      __apErrorVersion: 1,
      message:
        'Authentication required, not authenticated - You need to authenticate to access this operation.',
      errorName: '_',
      status: 401,
    });

    expect(describeStandardError(standardError)).toBe(
      'Authentication required, not authenticated - You need to authenticate to access this operation.',
    );
  });

  it('prefers the api message when the third party supplied one', () => {
    const standardError = JSON.stringify({
      __apErrorVersion: 1,
      message: 'Request failed with status code 403',
      apiMessage: 'Invalid role: admin required.',
      status: 403,
    });

    expect(describeStandardError(standardError)).toBe(
      'Invalid role: admin required.',
    );
  });

  it('never surfaces http details that can carry integration secrets', () => {
    const standardError = JSON.stringify({
      __apErrorVersion: 1,
      message: 'Authentication required',
      status: 401,
      responseHeaders: { 'set-cookie': 'session=super-secret-value' },
      requestBody: { apiKey: 'lin_api_should_never_be_shown' },
      responseBody: { errors: [{ message: 'nope' }] },
      raw: 'Error: Authentication required\n    at j (/usr/src/app/cache/v14/...)',
    });

    const described = describeStandardError(standardError);

    expect(described).toBe('Authentication required');
    expect(described).not.toContain('super-secret-value');
    expect(described).not.toContain('lin_api_should_never_be_shown');
    expect(described).not.toContain('/usr/src/app');
  });

  it('returns null for an empty or missing standardError', () => {
    expect(describeStandardError(undefined)).toBeNull();
    expect(describeStandardError('')).toBeNull();
  });

  it('returns null when the payload is not a serialized piece error', () => {
    expect(describeStandardError('Engine response is undefined')).toBeNull();
    expect(describeStandardError('{"not":"a friendly error"}')).toBeNull();
  });

  it('returns null when the parsed message is blank', () => {
    const standardError = JSON.stringify({
      __apErrorVersion: 1,
      message: '   ',
    });

    expect(describeStandardError(standardError)).toBeNull();
  });
});
