import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { handleWebhookDelivery } from '../../triggers/webhook-factory';

const SECRET = 'whsec_test';
const OBJECT = { id: 'img_1', object: 'image', status: 'completed' };
const ENVELOPE = { id: 'evt_1', type: 'image.completed', created_at: 'now', api_version: 'v1', data: { object: OBJECT } };
const RAW = JSON.stringify(ENVELOPE);
const NOW = 1_800_000_000;
const sign = (body: string) =>
  `t=${NOW},v1=${createHmac('sha256', SECRET).update(`${NOW}.${body}`).digest('hex')}`;

const delivery = (over: Record<string, unknown> = {}) => ({
  rawBody: RAW,
  body: ENVELOPE,
  headers: { 'x-signature': sign(RAW), 'x-event-type': 'image.completed' },
  secret: SECRET,
  events: ['image.completed'],
  now: NOW,
  ...over,
});

describe('handleWebhookDelivery', () => {
  it('emits the render object, not the envelope', () => {
    expect(handleWebhookDelivery(delivery())).toEqual([OBJECT]);
  });

  it('tolerates upper-case header names', () => {
    const headers = { 'X-Signature': sign(RAW), 'X-Event-Type': 'image.completed' };
    expect(handleWebhookDelivery(delivery({ headers }))).toEqual([OBJECT]);
  });

  it('drops a delivery with a bad signature', () => {
    expect(handleWebhookDelivery(delivery({ headers: { 'x-signature': 't=1,v1=deadbeef' } }))).toEqual([]);
  });

  it('drops a delivery with no stored secret', () => {
    expect(handleWebhookDelivery(delivery({ secret: undefined }))).toEqual([]);
  });

  it('drops a delivery whose raw body was not preserved', () => {
    expect(handleWebhookDelivery(delivery({ rawBody: ENVELOPE }))).toEqual([]);
  });

  it('drops an event type this trigger did not subscribe to', () => {
    const headers = { 'x-signature': sign(RAW), 'x-event-type': 'video.completed' };
    expect(handleWebhookDelivery(delivery({ headers }))).toEqual([]);
  });

  it('drops a payload with no render object', () => {
    const envelope = { id: 'evt_1', type: 'image.completed', data: {} };
    const raw = JSON.stringify(envelope);
    expect(
      handleWebhookDelivery(
        delivery({ rawBody: raw, body: envelope, headers: { 'x-signature': sign(raw), 'x-event-type': 'image.completed' } }),
      ),
    ).toEqual([]);
  });
});
