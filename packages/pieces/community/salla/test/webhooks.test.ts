import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { sallaApi } from '../src/lib/common/client';
import { StoredSallaWebhook, WEBHOOK_TOKEN_HEADER, sallaWebhooks } from '../src/lib/common/webhooks';

const auth = { access_token: 'token' };
const stored: StoredSallaWebhook = { webhookId: '123', token: 'a'.repeat(64), event: 'order.created' };

const orderCreatedBody = {
  event: 'order.created',
  merchant: 1305146709,
  created_at: 'Sun Jun 26 2022 12:21:48 GMT+0300',
  data: { id: 2116149737, reference_id: 41027662 },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isAuthentic', () => {
  it('accepts the right token', () => {
    expect(sallaWebhooks.isAuthentic({ stored, headers: { [WEBHOOK_TOKEN_HEADER]: stored.token } })).toBe(true);
  });

  it('reads the header case-insensitively, from arrays, and trims it', () => {
    expect(sallaWebhooks.isAuthentic({ stored, headers: { 'x-activepieces-webhook-token': stored.token } })).toBe(true);
    expect(sallaWebhooks.isAuthentic({ stored, headers: { 'X-ACTIVEPIECES-WEBHOOK-TOKEN': [stored.token, 'other'] } })).toBe(true);
    expect(sallaWebhooks.isAuthentic({ stored, headers: { 'x-activepieces-webhook-token': ` ${stored.token} ` } })).toBe(true);
  });

  it('rejects a wrong token of the same length', () => {
    expect(sallaWebhooks.isAuthentic({ stored, headers: { [WEBHOOK_TOKEN_HEADER]: 'b'.repeat(64) } })).toBe(false);
  });

  it('rejects a token of a different length without throwing', () => {
    expect(sallaWebhooks.isAuthentic({ stored, headers: { [WEBHOOK_TOKEN_HEADER]: 'a'.repeat(63) } })).toBe(false);
    expect(sallaWebhooks.isAuthentic({ stored, headers: { [WEBHOOK_TOKEN_HEADER]: 'a'.repeat(65) } })).toBe(false);
  });

  it('rejects a missing or empty token header', () => {
    expect(sallaWebhooks.isAuthentic({ stored, headers: {} })).toBe(false);
    expect(sallaWebhooks.isAuthentic({ stored, headers: { [WEBHOOK_TOKEN_HEADER]: '' } })).toBe(false);
    expect(sallaWebhooks.isAuthentic({ stored, headers: { [WEBHOOK_TOKEN_HEADER]: [] } })).toBe(false);
    expect(sallaWebhooks.isAuthentic({ stored, headers: { [WEBHOOK_TOKEN_HEADER]: 42 } })).toBe(false);
    expect(sallaWebhooks.isAuthentic({ stored, headers: undefined })).toBe(false);
  });

  it('rejects everything when nothing is stored', () => {
    expect(sallaWebhooks.isAuthentic({ stored: undefined, headers: { [WEBHOOK_TOKEN_HEADER]: '' } })).toBe(false);
    expect(sallaWebhooks.isAuthentic({ stored: null, headers: { [WEBHOOK_TOKEN_HEADER]: 'x' } })).toBe(false);
    expect(sallaWebhooks.isAuthentic({ stored: { ...stored, token: '' }, headers: { [WEBHOOK_TOKEN_HEADER]: '' } })).toBe(false);
  });

  it('does not accept the token in another header', () => {
    expect(sallaWebhooks.isAuthentic({ stored, headers: { authorization: stored.token } })).toBe(false);
  });
});

describe('readHeader', () => {
  it('finds the header whatever its case and skips non-string values', () => {
    expect(sallaWebhooks.readHeader({ headers: { 'X-Salla-Signature': 'abc' }, name: 'x-salla-signature' })).toBe('abc');
    expect(sallaWebhooks.readHeader({ headers: { 'x-salla-signature': ['abc', 'def'] }, name: 'X-Salla-Signature' })).toBe('abc');
    expect(sallaWebhooks.readHeader({ headers: { 'x-salla-signature': 5 }, name: 'X-Salla-Signature' })).toBeUndefined();
    expect(sallaWebhooks.readHeader({ headers: {}, name: 'X' })).toBeUndefined();
  });
});

describe('parseEvent, verifiedEvent and dedupeKey', () => {
  it('parses the Salla envelope', () => {
    expect(sallaWebhooks.parseEvent(orderCreatedBody)).toEqual({
      event: 'order.created',
      merchant: 1305146709,
      createdAt: 'Sun Jun 26 2022 12:21:48 GMT+0300',
      data: orderCreatedBody.data,
    });
  });

  it('rejects malformed bodies', () => {
    expect(sallaWebhooks.parseEvent(undefined)).toBeUndefined();
    expect(sallaWebhooks.parseEvent('order.created')).toBeUndefined();
    expect(sallaWebhooks.parseEvent([orderCreatedBody])).toBeUndefined();
    expect(sallaWebhooks.parseEvent({ event: 'order.created' })).toBeUndefined();
    expect(sallaWebhooks.parseEvent({ event: 'order.created', data: [] })).toBeUndefined();
    expect(sallaWebhooks.parseEvent({ event: 1, data: {} })).toBeUndefined();
  });

  it('drops odd merchant and created_at types', () => {
    expect(sallaWebhooks.parseEvent({ event: 'x', data: {}, merchant: { id: 1 }, created_at: 5 })).toEqual({
      event: 'x',
      merchant: undefined,
      createdAt: undefined,
      data: {},
    });
  });

  it('returns the event only when the token and the event name match', () => {
    const headers = { [WEBHOOK_TOKEN_HEADER]: stored.token };
    expect(sallaWebhooks.verifiedEvent({ stored, headers, body: orderCreatedBody, expectedEvents: ['order.created'] })?.event).toBe(
      'order.created',
    );
    expect(sallaWebhooks.verifiedEvent({ stored, headers, body: orderCreatedBody, expectedEvents: ['order.updated'] })).toBeUndefined();
    expect(
      sallaWebhooks.verifiedEvent({
        stored,
        headers: { [WEBHOOK_TOKEN_HEADER]: 'b'.repeat(64) },
        body: orderCreatedBody,
        expectedEvents: ['order.created'],
      }),
    ).toBeUndefined();
    expect(sallaWebhooks.verifiedEvent({ stored, headers, body: { nope: true }, expectedEvents: ['order.created'] })).toBeUndefined();
  });

  it('builds a dedupe key from event, data id and created_at', () => {
    const event = sallaWebhooks.parseEvent(orderCreatedBody);
    expect(event).toBeDefined();
    if (event) {
      expect(sallaWebhooks.dedupeKey(event)).toMatch(/^order\.created:2116149737:Sun Jun 26 2022 12:21:48 GMT\+0300:[0-9a-f]{16}$/);
    }
  });

  it('falls back to the cart, order or customer id when data has no id', () => {
    const createdAt = 'Tue Nov 10 2026 12:36:49 GMT+0300';
    expect(
      sallaWebhooks.dedupeKey({ event: 'e', createdAt, data: { cart: { id: 11 }, order: { id: 22 }, customer: { id: 33 } } }),
    ).toMatch(new RegExp(`^e:cart-11:${createdAt.replace('+', '\\+')}:[0-9a-f]{16}$`));
    expect(sallaWebhooks.dedupeKey({ event: 'e', createdAt, data: { cart: { total: 5 }, order: { id: ' 22 ' }, customer: { id: 33 } } })).toMatch(
      new RegExp(`^e:order-22:${createdAt.replace('+', '\\+')}:[0-9a-f]{16}$`),
    );
    expect(sallaWebhooks.dedupeKey({ event: 'e', createdAt, data: { cart: 'x', order: { id: '' }, customer: { id: 33 } } })).toMatch(
      new RegExp(`^e:customer-33:${createdAt.replace('+', '\\+')}:[0-9a-f]{16}$`),
    );
  });

  it('keeps two different changes to the same order in the same second apart, and an identical retry together', () => {
    const createdAt = 'Tue Nov 10 2026 12:36:49 GMT+0300';
    const paid = sallaWebhooks.dedupeKey({ event: 'order.updated', createdAt, data: { id: 7, status: { slug: 'payment_pending' } } });
    const shipped = sallaWebhooks.dedupeKey({ event: 'order.updated', createdAt, data: { id: 7, status: { slug: 'in_progress' } } });
    const retry = sallaWebhooks.dedupeKey({ event: 'order.updated', createdAt, data: { id: 7, status: { slug: 'payment_pending' } } });
    expect(paid).not.toBe(shipped);
    expect(retry).toBe(paid);
  });

  it('falls back to a short sha256 of data when no id is found', () => {
    expect(sallaWebhooks.dedupeKey({ event: 'x', data: {} })).toBe('x:sha256-44136fa355b3678a::44136fa355b3678a');
    const first = sallaWebhooks.dedupeKey({ event: 'x', data: { coupon: { code: 'A' } } });
    const second = sallaWebhooks.dedupeKey({ event: 'x', data: { coupon: { code: 'B' } } });
    expect(first).toMatch(/^x:sha256-[0-9a-f]{16}::[0-9a-f]{16}$/);
    expect(first).not.toBe(second);
    expect(sallaWebhooks.dedupeKey({ event: 'x', data: { coupon: { code: 'A' } } })).toBe(first);
  });
});

describe('register', () => {
  it('posts the event, url, version 2 and our token header, without a rule when none is set', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 201, headers: {}, body: { data: { id: 987 } } });
    const result = await sallaWebhooks.register({ auth, event: 'order.created', url: 'https://ap.example/webhook', rule: '  ' });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.POST);
    expect(sent.url).toBe('https://api.salla.dev/admin/v2/webhooks/subscribe');
    expect(sent.body).toMatchObject({ event: 'order.created', url: 'https://ap.example/webhook', version: 2 });
    expect(sent.body).not.toHaveProperty('rule');
    expect(sent.body).toHaveProperty('headers', [{ key: WEBHOOK_TOKEN_HEADER, value: result.token }]);
    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    expect(result).toEqual({ webhookId: '987', token: result.token, event: 'order.created' });
  });

  it('sends a trimmed rule when set and makes a new token each time', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 201, headers: {}, body: { data: { id: 'w1' } } });
    const first = await sallaWebhooks.register({ auth, event: 'order.created', url: 'u', rule: ' total > 100 ' });
    const second = await sallaWebhooks.register({ auth, event: 'order.created', url: 'u' });
    expect(spy.mock.calls[0][0].body).toMatchObject({ rule: 'total > 100' });
    expect(spy.mock.calls[1][0].body).not.toHaveProperty('rule');
    expect(first.token).not.toBe(second.token);
  });

  it('throws when Salla returns no ID', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 201, headers: {}, body: { data: {} } });
    await expect(sallaWebhooks.register({ auth, event: 'order.created', url: 'u' })).rejects.toThrow('did not return its ID');
  });
});

describe('remove', () => {
  it('deletes by ?id= and never by url', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 202, headers: {}, body: {} });
    await sallaWebhooks.remove({ auth, webhookId: ' 987 ' });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.DELETE);
    const url = new URL(sent.url);
    expect(url.pathname).toBe('/admin/v2/webhooks/unsubscribe');
    expect(url.searchParams.get('id')).toBe('987');
    expect(url.searchParams.has('url')).toBe(false);
    expect(sent.body).toBeUndefined();
  });

  it('does nothing without a webhook ID', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await sallaWebhooks.remove({ auth, webhookId: undefined });
    await sallaWebhooks.remove({ auth, webhookId: null });
    await sallaWebhooks.remove({ auth, webhookId: '  ' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('ignores 404 and 410', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(new HttpError({}, { status: 404, responseBody: {} }))
      .mockRejectedValueOnce(new HttpError({}, { status: 410, responseBody: {} }));
    await expect(sallaWebhooks.remove({ auth, webhookId: '1' })).resolves.toBeUndefined();
    await expect(sallaWebhooks.remove({ auth, webhookId: '1' })).resolves.toBeUndefined();
  });

  it('rethrows other errors', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 401, responseBody: {} }));
    await expect(sallaWebhooks.remove({ auth, webhookId: '1' })).rejects.toThrow('Reconnect the Salla connection');
  });
});

describe('register when Salla restores an older webhook on the same URL', () => {
  function vendorError(status: number): HttpError {
    return new HttpError({}, { status, responseBody: { status, success: false, error: { code: 'error', message: 'alert.invalid_fields' } } });
  }

  it('deletes the new subscription and rethrows when the token PUT fails, so no orphan is left', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 60587520, headers: { [WEBHOOK_TOKEN_HEADER]: 'old-token' } } } })
      .mockRejectedValueOnce(vendorError(422))
      .mockResolvedValueOnce({ status: 202, headers: {}, body: {} });
    const failure = await sallaWebhooks.register({ auth, event: 'order.created', url: 'https://ap.example/webhook' }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect(sallaApi.isSallaApiError(failure) && failure.status).toBe(422);
    expect(spy).toHaveBeenCalledTimes(3);
    const cleanup = spy.mock.calls[2][0];
    expect(cleanup.method).toBe(HttpMethod.DELETE);
    expect(new URL(cleanup.url).searchParams.get('id')).toBe('60587520');
  });

  it('still rethrows the PUT error when the cleanup delete fails too', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 60587520, headers: { [WEBHOOK_TOKEN_HEADER]: 'old-token' } } } })
      .mockRejectedValueOnce(vendorError(422))
      .mockRejectedValueOnce(vendorError(403));
    const failure = await sallaWebhooks.register({ auth, event: 'order.created', url: 'https://ap.example/webhook' }).catch((error: unknown) => error);
    expect(sallaApi.isSallaApiError(failure) && failure.status).toBe(422);
  });

  it('re-sends our token with PUT when Salla echoes a different token header', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 60587520, headers: { [WEBHOOK_TOKEN_HEADER]: 'old-token' } } } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 60587520 } } });
    const result = await sallaWebhooks.register({ auth, event: 'order.created', url: 'https://ap.example/webhook' });
    expect(spy).toHaveBeenCalledTimes(2);
    const put = spy.mock.calls[1][0];
    expect(put.method).toBe(HttpMethod.PUT);
    expect(put.url).toBe('https://api.salla.dev/admin/v2/webhooks/60587520');
    expect(put.body).toEqual({ url: 'https://ap.example/webhook', headers: [{ key: WEBHOOK_TOKEN_HEADER, value: result.token }] });
  });

  it('reads the echoed header from the key/value array shape too', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 7, headers: [{ key: WEBHOOK_TOKEN_HEADER.toLowerCase(), value: 'old-token' }] } } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 7 } } });
    await sallaWebhooks.register({ auth, event: 'order.created', url: 'https://ap.example/webhook' });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('makes no extra call when the echoed token matches or no headers come back', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      const sent = request.body;
      const headers = typeof sent === 'object' && sent !== null && 'headers' in sent ? sent.headers : undefined;
      return { status: 200, headers: {}, body: { data: { id: 8, headers } } };
    });
    await sallaWebhooks.register({ auth, event: 'order.created', url: 'https://ap.example/webhook' });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockReset();
    spy.mockResolvedValue({ status: 200, headers: {}, body: { data: { id: 9 } } });
    await sallaWebhooks.register({ auth, event: 'order.created', url: 'https://ap.example/webhook' });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
