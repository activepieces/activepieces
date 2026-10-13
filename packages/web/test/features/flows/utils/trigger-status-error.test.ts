import { formatPieceError } from '@activepieces/core-utils';
import { describe, expect, it } from 'vitest';

import { triggerStatusErrorUtils } from '@/features/flows/utils/trigger-status-error';

const { describeStandardError, parseStandardError } = triggerStatusErrorUtils;

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

describe('describeStandardError never leaks the http envelope it falls back to', () => {
  const SECRET = 'sk-live-should-never-be-shown';

  it.each([
    ['an empty response body, the most common 401', 401, ''],
    ['no response body at all', 401, undefined],
    [
      'a body whose message sits under an unrecognised key',
      400,
      { msg: 'bad' },
    ],
    ['a body keyed with a capital Message', 403, { Message: 'Forbidden' }],
    ['an array body carrying no message', 500, [{ code: 42 }]],
    ['an array body of bare numbers', 500, [404, 500]],
  ])('returns null for %s', (_label, status, responseBody) => {
    const standardError = serializeEngineError(
      httpErrorFromPiece({
        status,
        responseBody,
        requestBody: { api_key: SECRET },
      }),
    );

    expect(describeStandardError(standardError)).toBeNull();
  });

  it('never renders the request body for any of those shapes', () => {
    const shapes: unknown[] = [
      '',
      undefined,
      { msg: 'bad' },
      { Message: 'Forbidden' },
      [{ code: 42 }],
      [404, 500],
    ];

    for (const responseBody of shapes) {
      const standardError = serializeEngineError(
        httpErrorFromPiece({
          status: 401,
          responseBody,
          requestBody: { api_key: SECRET },
        }),
      );

      expect(describeStandardError(standardError) ?? '').not.toContain(SECRET);
    }
  });

  it('still reads the message when the piece error carries one', () => {
    const standardError = serializeEngineError(
      httpErrorFromPiece({
        status: 401,
        responseBody: { message: 'Invalid auth token' },
        requestBody: { api_key: SECRET },
      }),
    );

    expect(describeStandardError(standardError)).toBe('Invalid auth token');
  });

  it('keeps a message that merely starts with a brace but is not json', () => {
    const standardError = JSON.stringify({
      __apErrorVersion: 1,
      message: '{fieldName} is required',
    });

    expect(describeStandardError(standardError)).toBe(
      '{fieldName} is required',
    );
  });

  it('prefers the api message over a client side wrapper message', () => {
    const standardError = JSON.stringify({
      __apErrorVersion: 1,
      message: 'Request failed with status code 422',
      apiMessage: 'name is required',
    });

    expect(describeStandardError(standardError)).toBe('name is required');
  });
});

describe('parseStandardError gives the dialog a payload it can pretty print', () => {
  function toCollapsibleJsonText(json: unknown): string {
    return typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  }

  it('returns the parsed friendly error rather than the json string', () => {
    const standardError = serializeEngineError(
      httpErrorFromPiece({
        status: 401,
        responseBody: { message: 'Invalid auth token' },
        requestBody: { token: 'xoxb-token' },
      }),
    );

    const parsed = parseStandardError(standardError);

    expect(parsed).not.toBeNull();
    expect(parsed?.status).toBe(401);
    expect(parsed?.message).toBe('Invalid auth token');
  });

  it('renders technical details without escaped quotes or literal backslash n', () => {
    const standardError = serializeEngineError(
      httpErrorFromPiece({
        status: 401,
        responseBody: { message: 'Invalid auth token' },
        requestBody: { token: 'xoxb-token' },
      }),
    );

    const detailsText = toCollapsibleJsonText(
      parseStandardError(standardError),
    );

    expect(detailsText).not.toContain('\\"');
    expect(detailsText).not.toContain('\\\\n');
    expect(detailsText.split('\n').length).toBeGreaterThan(5);
    expect(detailsText).toContain('"status": 401');
  });

  it('returns null for an engine level failure so the dialog keeps its wrapper', () => {
    expect(parseStandardError('Engine response is undefined')).toBeNull();
    expect(parseStandardError(undefined)).toBeNull();
  });
});
