import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HttpError } from '@activepieces/pieces-common';
import { mapTransportError } from '../src/lib/errors';

const errorXml = readFileSync(join(__dirname, 'fixtures', 'error.xml'), 'utf8');

describe('mapTransportError', () => {
  test('maps XML ErrorCode and RequestID without error.message', () => {
    const httpError = new HttpError({ leak: 'SECRET_BODY_MARKER' }, { status: 400, responseBody: errorXml });
    const mapped = mapTransportError(httpError);
    expect(mapped.code).toBe('VALIDATION_FAILED');
    expect(mapped.requestId).toBe('kcdzj7xl');
    expect(mapped.message).toContain('VALIDATION_FAILED');
    expect(mapped.message).toContain('kcdzj7xl');
    expect(mapped.message).toContain('MailSubject MANDATORY');
    expect(mapped.message).not.toContain('SECRET_BODY_MARKER');
    expect(mapped.message).not.toContain(httpError.message);
    expect(mapped.message).not.toContain('2020-07-09');
    expect(mapped.message).not.toContain('Required');
  });

  test.each(['invalid_aconex_account', 'inavlid_aconex_account'])('maps Lobby JSON spelling %s', (code) => {
    const httpError = new HttpError(
      { leak: 'SECRET_BODY_MARKER' },
      { status: 400, responseBody: { error: code, error_description: 'SECRET_DESC' } },
    );
    const mapped = mapTransportError(httpError);
    expect(mapped.code).toBe(code);
    expect(mapped.message).toContain(code);
    expect(mapped.message).not.toContain('SECRET_DESC');
    expect(mapped.message).not.toContain('SECRET_BODY_MARKER');
    expect(mapped.message).not.toContain(httpError.message);
  });

  test('maps a Lobby JSON string body', () => {
    const httpError = new HttpError({ leak: 'SECRET_BODY_MARKER' }, {
      status: 401,
      responseBody: '{"error":"inavlid_aconex_account","error_description":"SECRET_DESC"}',
    });
    const mapped = mapTransportError(httpError);
    expect(mapped.message).toContain('inavlid_aconex_account');
    expect(mapped.message).not.toContain(httpError.message);
  });
});
