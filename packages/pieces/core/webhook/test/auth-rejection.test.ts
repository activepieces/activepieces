/// <reference types="vitest/globals" />

import { createHmac } from 'crypto';
import { catchWebhook } from '../src/lib/triggers/catch-hook';

type AuthProps = {
  authType: string;
  authFields: Record<string, unknown>;
};

type WebhookPayload = {
  headers: Record<string, string>;
  rawBody?: unknown;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildContext = (propsValue: AuthProps, payload: WebhookPayload): any => ({
  propsValue,
  payload,
});

function basicHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

describe('catchWebhook.run authentication', () => {
  test('returns the payload when no auth is configured', async () => {
    const payload = { headers: {}, rawBody: '' };
    const result = await catchWebhook.run(
      buildContext({ authType: 'none', authFields: {} }, payload)
    );
    expect(result).toEqual([payload]);
  });

  test('returns the payload when basic auth matches', async () => {
    const payload = {
      headers: { authorization: basicHeader('user', 'pass') },
      rawBody: '',
    };
    const result = await catchWebhook.run(
      buildContext(
        { authType: 'basic', authFields: { username: 'user', password: 'pass' } },
        payload
      )
    );
    expect(result).toEqual([payload]);
  });

  test('throws when basic auth credentials are wrong', async () => {
    const payload = {
      headers: { authorization: basicHeader('user', 'wrong') },
      rawBody: '',
    };
    await expect(
      catchWebhook.run(
        buildContext(
          { authType: 'basic', authFields: { username: 'user', password: 'pass' } },
          payload
        )
      )
    ).rejects.toThrow('Webhook authentication failed');
  });

  test('throws when basic auth header is missing', async () => {
    await expect(
      catchWebhook.run(
        buildContext(
          { authType: 'basic', authFields: { username: 'user', password: 'pass' } },
          { headers: {}, rawBody: '' }
        )
      )
    ).rejects.toThrow('Webhook authentication failed');
  });

  test('returns the payload when header auth matches', async () => {
    const payload = { headers: { 'x-secret': 'expected' }, rawBody: '' };
    const result = await catchWebhook.run(
      buildContext(
        { authType: 'header', authFields: { headerName: 'x-secret', headerValue: 'expected' } },
        payload
      )
    );
    expect(result).toEqual([payload]);
  });

  test('throws when header auth value does not match', async () => {
    await expect(
      catchWebhook.run(
        buildContext(
          { authType: 'header', authFields: { headerName: 'x-secret', headerValue: 'expected' } },
          { headers: { 'x-secret': 'wrong' }, rawBody: '' }
        )
      )
    ).rejects.toThrow('Webhook authentication failed');
  });

  test('returns the payload when hmac signature is valid', async () => {
    const rawBody = JSON.stringify({ event: 'push' });
    const signature = createHmac('sha256', 'secret').update(rawBody).digest('hex');
    const payload = { headers: { 'x-signature': signature }, rawBody };
    const result = await catchWebhook.run(
      buildContext(
        {
          authType: 'hmac',
          authFields: {
            hmacHeaderName: 'x-signature',
            hmacSecret: 'secret',
            hmacAlgorithm: 'sha256',
            hmacEncoding: 'hex',
            hmacSignaturePrefix: '',
          },
        },
        payload
      )
    );
    expect(result).toEqual([payload]);
  });

  test('throws when hmac signature is invalid', async () => {
    await expect(
      catchWebhook.run(
        buildContext(
          {
            authType: 'hmac',
            authFields: {
              hmacHeaderName: 'x-signature',
              hmacSecret: 'secret',
              hmacAlgorithm: 'sha256',
              hmacEncoding: 'hex',
              hmacSignaturePrefix: '',
            },
          },
          { headers: { 'x-signature': 'deadbeef' }, rawBody: '{}' }
        )
      )
    ).rejects.toThrow('Webhook authentication failed');
  });
});
