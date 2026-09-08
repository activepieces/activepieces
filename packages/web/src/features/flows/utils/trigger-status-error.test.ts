import { formatPieceError } from '@activepieces/core-utils';
import { describe, expect, it } from 'vitest';

import { triggerStatusErrorUtils } from './trigger-status-error';

const { describeStandardError } = triggerStatusErrorUtils;

function serializeEngineError(error: unknown): string {
  return JSON.stringify(
    formatPieceError(error, {
      raw: 'Error: at j (/usr/src/app/cache/v14/index.js:1:1)',
    }),
  );
}

function httpErrorFromPiece({
  status,
  responseBody,
  requestBody,
}: {
  status: number;
  responseBody: unknown;
  requestBody: unknown;
}): unknown {
  return {
    name: 'HttpError',
    message: JSON.stringify({
      response: { status, body: responseBody },
      request: { body: requestBody },
    }),
    response: { status, body: responseBody },
    request: { body: requestBody },
  };
}

describe('triggerStatusErrorUtils.describeStandardError', () => {
  it('surfaces the api message behind a piece http failure', () => {
    const standardError = serializeEngineError(
      httpErrorFromPiece({
        status: 401,
        responseBody: { ok: false, error: 'invalid_auth' },
        requestBody: { token: 'xoxb-token' },
      }),
    );

    expect(describeStandardError(standardError)).toBe('invalid_auth');
  });

  it('surfaces the api message when the error body is a bare array', () => {
    const standardError = serializeEngineError(
      httpErrorFromPiece({
        status: 400,
        responseBody: [{ message: 'A public HTTPS URL is required' }],
        requestBody: { url: 'http://localhost:3000/hook' },
      }),
    );

    expect(describeStandardError(standardError)).toBe(
      'A public HTTPS URL is required',
    );
  });

  it('surfaces the message of a plain error thrown by a trigger', () => {
    const standardError = serializeEngineError(
      new Error('This trigger does not support webhook registration'),
    );

    expect(describeStandardError(standardError)).toBe(
      'This trigger does not support webhook registration',
    );
  });

  it('returns the parsed message alone, never the http details beside it', () => {
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

  it('returns null instead of throwing on a payload nested past the parser limit', () => {
    const standardError = `${'['.repeat(200_000)}"leaf"${']'.repeat(200_000)}`;

    expect(describeStandardError(standardError)).toBeNull();
  });

  it('returns null when the parsed message is blank', () => {
    const standardError = JSON.stringify({
      __apErrorVersion: 1,
      message: '   ',
    });

    expect(describeStandardError(standardError)).toBeNull();
  });
});
