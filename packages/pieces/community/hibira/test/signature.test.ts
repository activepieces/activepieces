import { createHmac } from 'crypto';
import { signQuery, signatureMatches } from '../src/lib/common/signature';

describe('signQuery', () => {
  // The example from the Pusher HTTP API reference.
  test('matches the Pusher reference signature', () => {
    const qs = signQuery({
      key: '278d425bdf160c739803',
      secret: '7ad3773142a6692b25b8',
      method: 'POST',
      path: '/apps/3/events',
      query: {},
      body: '{"name":"foo","channels":["project-3"],"data":"{\\"some\\":\\"data\\"}"}',
      now: 1353088179 * 1000,
    });
    expect(qs['body_md5']).toBe('ec365a775a4cd0599faeb73354201b6f');
    expect(qs['auth_signature']).toBe('da454824c97ba181a32ccc17a72625ba02771f50b50e1e7430e47a1f3f457e6c');
  });

  test('signs GET requests without body_md5, with query keys sorted', () => {
    const qs = signQuery({ key: 'k', secret: 's', method: 'GET', path: '/apps/1/channels', query: { info: 'user_count', filter_by_prefix: 'presence-' }, now: 0 });
    expect(qs['body_md5']).toBeUndefined();
    const canonical = 'auth_key=k&auth_timestamp=0&auth_version=1.0&filter_by_prefix=presence-&info=user_count';
    expect(qs['auth_signature']).toBe(createHmac('sha256', 's').update(`GET\n/apps/1/channels\n${canonical}`).digest('hex'));
  });
});

describe('signatureMatches', () => {
  test('compares hex signatures case-insensitively and rejects missing ones', () => {
    expect(signatureMatches('abcd', 'ABCD')).toBe(true);
    expect(signatureMatches('abcd', 'abce')).toBe(false);
    expect(signatureMatches('abcd', undefined)).toBe(false);
    expect(signatureMatches('abcd', 'abc')).toBe(false);
  });
});
