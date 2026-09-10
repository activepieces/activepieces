import { describe, expect, it } from 'vitest';
import { sentSecurity } from '../src/lib/common/security';
import { SIGNING_SECRET } from './helpers';

const rawBody =
  '{\n  "field": "message", "event": "message.received", "timestamp": "2026-01-15T10:30:00Z", "payload": {"text":"Përshëndetje 👋", "message_id":"00000000-0000-4000-8000-000000000001"}\n}';
const headers = {
  'X-Webhook-ID': 'webhook-test',
  'X-Webhook-Timestamp': '1768473000',
  'X-Webhook-Signature': 'v1,4AJ8Of/Bxuv4B/vRsRtz/5DDlL/vO5y81saygRBtnDc=',
};
const fixture = {
  secret: SIGNING_SECRET,
  webhookId: 'webhook-test',
  rawBody,
  headers,
  now: 1768473000000,
};

describe('Sent HMAC-SHA256 over original bytes', () => {
  it('accepts a fixed independently generated signature with whitespace and Unicode', () => {
    expect(sentSecurity.verify(fixture)).toBe(true);
    expect(
      sentSecurity.verify({ ...fixture, rawBody: Buffer.from(rawBody, 'utf8') })
    ).toBe(true);
  });
  it('accepts the base64 secret with or without the whsec_ prefix', () => {
    expect(
      sentSecurity.verify({ ...fixture, secret: SIGNING_SECRET.slice(6) })
    ).toBe(true);
  });
  it('does not stringify parsed JSON as a substitute for the original body', () => {
    expect(
      sentSecurity.verify({ ...fixture, rawBody: JSON.parse(rawBody) })
    ).toBe(false);
    expect(
      sentSecurity.verify({
        ...fixture,
        rawBody: JSON.stringify(JSON.parse(rawBody)),
      })
    ).toBe(false);
  });
  it.each([undefined, null, '', 'tampered'])(
    'rejects an unavailable or tampered raw body',
    (value) => {
      expect(sentSecurity.verify({ ...fixture, rawBody: value })).toBe(false);
    }
  );
  it.each(['X-Webhook-ID', 'X-Webhook-Timestamp', 'X-Webhook-Signature'])(
    'rejects a missing %s header',
    (name) => {
      expect(
        sentSecurity.verify({
          ...fixture,
          headers: Object.fromEntries(
            Object.entries(headers).filter(([key]) => key !== name)
          ),
        })
      ).toBe(false);
    }
  );
  it('requires the stored webhook ID even with an otherwise valid signature', () => {
    expect(
      sentSecurity.verify({ ...fixture, webhookId: 'other-webhook' })
    ).toBe(false);
  });
  it.each([-301, 301, 3600])(
    'rejects timestamps outside the replay window (%s seconds)',
    (offset) => {
      expect(
        sentSecurity.verify({ ...fixture, now: fixture.now + offset * 1000 })
      ).toBe(false);
    }
  );
  it.each([-300, 300])(
    'accepts the boundary of the 300-second replay window (%s)',
    (offset) => {
      expect(
        sentSecurity.verify({ ...fixture, now: fixture.now + offset * 1000 })
      ).toBe(true);
    }
  );
  it.each(['NaN', 'Infinity', '1e9', '-1', '1768473000.0'])(
    'rejects malformed timestamps: %s',
    (timestamp) => {
      expect(
        sentSecurity.verify({
          ...fixture,
          headers: { ...headers, 'X-Webhook-Timestamp': timestamp },
        })
      ).toBe(false);
    }
  );
  it.each([
    '',
    'v1,short',
    'v2,4AJ8Of/Bxuv4B/vRsRtz/5DDlL/vO5y81saygRBtnDc=',
    'not-a-signature',
  ])('rejects malformed signatures', (signature) => {
    expect(
      sentSecurity.verify({
        ...fixture,
        headers: { ...headers, 'X-Webhook-Signature': signature },
      })
    ).toBe(false);
  });
  it('accepts header casing and a valid versioned signature among tokens', () => {
    expect(
      sentSecurity.verify({
        ...fixture,
        headers: Object.fromEntries(
          Object.entries(headers).map(([key, value]) => [
            key.toLowerCase(),
            value,
          ])
        ),
      })
    ).toBe(true);
    expect(
      sentSecurity.verify({
        ...fixture,
        headers: {
          ...headers,
          'X-Webhook-Signature': `v1,invalid ${headers['X-Webhook-Signature']}`,
        },
      })
    ).toBe(true);
  });
});
