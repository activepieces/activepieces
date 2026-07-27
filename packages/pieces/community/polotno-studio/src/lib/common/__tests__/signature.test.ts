import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyWebhookSignature } from '../signature';

const SECRET = 'whsec_test';
const BODY = '{"id":"evt_1","type":"image.completed"}';
const sign = (t: number, body = BODY, secret = SECRET) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;

describe('verifyWebhookSignature', () => {
  const now = 1_800_000_000;

  it('accepts a valid signature', () => {
    expect(verifyWebhookSignature(sign(now), BODY, SECRET, now)).toEqual({ ok: true });
  });

  it('accepts a Buffer raw body', () => {
    expect(verifyWebhookSignature(sign(now), Buffer.from(BODY, 'utf8'), SECRET, now)).toEqual({ ok: true });
  });

  it('rejects a missing header', () => {
    expect(verifyWebhookSignature(undefined, BODY, SECRET, now)).toEqual({ ok: false, reason: 'missing_header' });
  });

  it('rejects a malformed header', () => {
    expect(verifyWebhookSignature('garbage', BODY, SECRET, now)).toEqual({ ok: false, reason: 'malformed_header' });
  });

  it('rejects a tampered body', () => {
    const result = verifyWebhookSignature(sign(now), `${BODY} `, SECRET, now);
    expect(result).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects a wrong secret', () => {
    expect(verifyWebhookSignature(sign(now, BODY, 'other'), BODY, SECRET, now)).toEqual({
      ok: false,
      reason: 'bad_signature',
    });
  });

  it('rejects a timestamp outside the replay window', () => {
    expect(verifyWebhookSignature(sign(now - 301), BODY, SECRET, now)).toEqual({
      ok: false,
      reason: 'stale_timestamp',
    });
  });

  it('accepts a timestamp at the edge of the replay window', () => {
    expect(verifyWebhookSignature(sign(now - 300), BODY, SECRET, now)).toEqual({ ok: true });
  });

  it('rejects a raw body that is neither Buffer nor string', () => {
    const parsed = { id: 'evt_1', type: 'image.completed' };
    expect(verifyWebhookSignature(sign(now), parsed, SECRET, now)).toEqual({
      ok: false,
      reason: 'unusable_raw_body',
    });
  });
});
