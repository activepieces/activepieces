import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWebhookSignature } from '../signature';

const SECRET = 'whsec_test';
const BODY = '{"id":"evt_1","type":"image.completed"}';
const sign = ({ t, body = BODY, secret = SECRET }: { t: number; body?: string; secret?: string }) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;

describe('verifyWebhookSignature', () => {
  const now = 1_800_000_000;

  it('accepts a valid signature', () => {
    expect(verifyWebhookSignature({ header: sign({ t: now }), rawBody: BODY, secret: SECRET, nowSeconds: now })).toEqual({
      ok: true,
    });
  });

  it('accepts a Buffer raw body', () => {
    expect(
      verifyWebhookSignature({
        header: sign({ t: now }),
        rawBody: Buffer.from(BODY, 'utf8'),
        secret: SECRET,
        nowSeconds: now,
      }),
    ).toEqual({ ok: true });
  });

  it('rejects a missing header', () => {
    expect(verifyWebhookSignature({ header: undefined, rawBody: BODY, secret: SECRET, nowSeconds: now })).toEqual({
      ok: false,
      reason: 'missing_header',
    });
  });

  it('rejects a malformed header', () => {
    expect(verifyWebhookSignature({ header: 'garbage', rawBody: BODY, secret: SECRET, nowSeconds: now })).toEqual({
      ok: false,
      reason: 'malformed_header',
    });
  });

  it('rejects a tampered body', () => {
    const result = verifyWebhookSignature({
      header: sign({ t: now }),
      rawBody: `${BODY} `,
      secret: SECRET,
      nowSeconds: now,
    });
    expect(result).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects a wrong secret', () => {
    expect(
      verifyWebhookSignature({
        header: sign({ t: now, body: BODY, secret: 'other' }),
        rawBody: BODY,
        secret: SECRET,
        nowSeconds: now,
      }),
    ).toEqual({
      ok: false,
      reason: 'bad_signature',
    });
  });

  it('rejects a timestamp outside the replay window', () => {
    expect(
      verifyWebhookSignature({ header: sign({ t: now - 301 }), rawBody: BODY, secret: SECRET, nowSeconds: now }),
    ).toEqual({
      ok: false,
      reason: 'stale_timestamp',
    });
  });

  it('accepts a timestamp at the edge of the replay window', () => {
    expect(
      verifyWebhookSignature({ header: sign({ t: now - 300 }), rawBody: BODY, secret: SECRET, nowSeconds: now }),
    ).toEqual({ ok: true });
  });

  it('rejects a raw body that is neither Buffer nor string', () => {
    const parsed = { id: 'evt_1', type: 'image.completed' };
    expect(
      verifyWebhookSignature({ header: sign({ t: now }), rawBody: parsed, secret: SECRET, nowSeconds: now }),
    ).toEqual({
      ok: false,
      reason: 'unusable_raw_body',
    });
  });
});
