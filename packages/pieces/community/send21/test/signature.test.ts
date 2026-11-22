/// <reference types="vitest/globals" />

import { isHandled, rememberDelivery } from '../src/lib/common/deliveries';
import { signV2, verifySignatureV2 } from '../src/lib/common/signature';

const secret = 'test-webhook-secret';
const deliveryId = 'delivery-1';
const body = Buffer.from(
  JSON.stringify({
    event: 'draft.confirmed',
    data: { draftId: '3f6c2a9e-5d1b-4c8e-9a7f-2b4d6e8f0a1c', status: 'Confirmed' },
  })
);

describe('verifySignatureV2', () => {
  test('accepts a fresh V2 signature', () => {
    const now = 1_700_000_000;
    const header = signV2(body, deliveryId, now, secret);
    expect(verifySignatureV2(body, header, deliveryId, secret, { now })).toBe(true);
  });

  test('rejects a signature older than 5 minutes', () => {
    const sent = 1_700_000_000;
    const header = signV2(body, deliveryId, sent, secret);
    expect(verifySignatureV2(body, header, deliveryId, secret, { now: sent + 301 })).toBe(false);
  });

  test('rejects a different delivery id, a tampered body or a missing header', () => {
    const now = 1_700_000_000;
    const header = signV2(body, deliveryId, now, secret);
    expect(verifySignatureV2(body, header, 'other', secret, { now })).toBe(false);
    expect(verifySignatureV2(Buffer.from('{"event":"forged"}'), header, deliveryId, secret, { now })).toBe(false);
    expect(verifySignatureV2(body, undefined, deliveryId, secret, { now })).toBe(false);
  });
});

describe('delivery dedupe', () => {
  test('a handled delivery id is recognised and the list stays bounded', () => {
    let handled: string[] = [];
    handled = rememberDelivery(handled, 'a');
    expect(isHandled(handled, 'a')).toBe(true);
    expect(isHandled(handled, 'b')).toBe(false);
    for (let i = 0; i < 500; i++) handled = rememberDelivery(handled, `d${i}`);
    expect(handled.length).toBe(200);
    expect(isHandled(handled, 'd499')).toBe(true);
  });
});
