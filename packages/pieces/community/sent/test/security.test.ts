import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
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

describe('Sent version 2 (Standard Webhooks) signatures', () => {
  const eventId = 'msg_2f7c1d0e-version-two';
  const timestamp = '1768473000';
  const digest = createHmac(
    'sha256',
    Buffer.from(SIGNING_SECRET.slice(6), 'base64')
  )
    .update(`${eventId}.${timestamp}.${rawBody}`)
    .digest('base64');
  const v2Headers = {
    'webhook-id': eventId,
    'webhook-timestamp': timestamp,
    'webhook-signature': `v1,${digest}`,
  };
  const v2 = { ...fixture, headers: v2Headers };
  it('accepts a v2 delivery whose webhook-id is the per-event ID', () => {
    expect(sentSecurity.verify({ ...v2, version: 2 })).toBe(true);
    expect(sentSecurity.verify(v2)).toBe(true);
  });
  it('accepts a v2 signature among rotated signatures', () => {
    expect(
      sentSecurity.verify({
        ...v2,
        version: 2,
        headers: {
          ...v2Headers,
          'webhook-signature': `v1,c3RhbGU= v1,${digest}`,
        },
      })
    ).toBe(true);
  });
  it('rejects a v2 delivery signed over a different event ID', () => {
    expect(
      sentSecurity.verify({
        ...v2,
        version: 2,
        headers: { ...v2Headers, 'webhook-id': 'msg_other' },
      })
    ).toBe(false);
  });
  it.each(['webhook-id', 'webhook-timestamp', 'webhook-signature'])(
    'rejects a v2 delivery missing %s',
    (name) => {
      expect(
        sentSecurity.verify({
          ...v2,
          version: 2,
          headers: Object.fromEntries(
            Object.entries(v2Headers).filter(([key]) => key !== name)
          ),
        })
      ).toBe(false);
    }
  );
  it('rejects a stale v2 timestamp', () => {
    expect(
      sentSecurity.verify({ ...v2, version: 2, now: fixture.now + 301000 })
    ).toBe(false);
  });
  it('does not accept v1 headers on a webhook recorded as v2, or v2 headers on v1', () => {
    expect(sentSecurity.verify({ ...fixture, version: 2 })).toBe(false);
    expect(sentSecurity.verify({ ...v2, version: 1 })).toBe(false);
  });
});

describe('signing secret length', () => {
  const vector = {
    secret: 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw',
    id: 'msg_p5jXN8AQM9LWM0D4loKWxJek',
    timestamp: '1614265330',
    body: '{"test": 2432232314}',
    signature: 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=',
  };
  function signWith(secretBytes: number) {
    const key = Buffer.alloc(secretBytes, 7);
    const signature = `v1,${createHmac('sha256', key)
      .update(`${vector.id}.${vector.timestamp}.${vector.body}`)
      .digest('base64')}`;
    return sentSecurity.verify({
      secret: `whsec_${key.toString('base64')}`,
      webhookId: 'unused',
      version: 2,
      headers: {
        'webhook-id': vector.id,
        'webhook-timestamp': vector.timestamp,
        'webhook-signature': signature,
      },
      rawBody: vector.body,
      now: Number(vector.timestamp) * 1000,
    });
  }
  it('accepts the published Standard Webhooks test vector (24-byte secret)', () => {
    expect(
      sentSecurity.verify({
        secret: vector.secret,
        webhookId: 'unused',
        version: 2,
        headers: {
          'webhook-id': vector.id,
          'webhook-timestamp': vector.timestamp,
          'webhook-signature': vector.signature,
        },
        rawBody: vector.body,
        now: Number(vector.timestamp) * 1000,
      })
    ).toBe(true);
  });
  it.each([24, 32, 48, 64])('accepts a %s-byte secret', (bytes) => {
    expect(signWith(bytes)).toBe(true);
  });
  it.each([16, 23, 65])('rejects a %s-byte secret', (bytes) => {
    expect(signWith(bytes)).toBe(false);
  });
});
