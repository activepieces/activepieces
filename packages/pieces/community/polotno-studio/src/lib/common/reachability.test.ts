import { describe, expect, it } from 'vitest';
import { isPubliclyReachable } from './reachability';

describe('isPubliclyReachable', () => {
  it.each([
    'https://cloud.activepieces.com/api/v1/flow-runs/abc/requests/def',
    'https://ap.example.co.uk/api/v1/x',
    'https://[::ffff:8.8.8.8]/x',
  ])('accepts public https URL %s', (url) => {
    expect(isPubliclyReachable(url)).toBe(true);
  });

  it.each([
    'http://cloud.activepieces.com/api/v1/x',
    'https://localhost:8080/api/v1/x',
    'https://127.0.0.1/api/v1/x',
    'https://10.1.2.3/api/v1/x',
    'https://172.16.0.1/api/v1/x',
    'https://172.31.255.254/api/v1/x',
    'https://192.168.1.1/api/v1/x',
    'https://169.254.169.254/api/v1/x',
    'https://100.64.0.1/api/v1/x',
    'https://[::1]/api/v1/x',
    'https://[fd12:3456::1]/api/v1/x',
    'https://activepieces.local/api/v1/x',
    'https://ap.internal/api/v1/x',
    'https://[::ffff:127.0.0.1]/x',
    'https://[::ffff:10.1.2.3]/x',
    'https://[::ffff:192.168.1.1]/x',
    'https://[::ffff:7f00:1]/x',
    'not-a-url',
  ])('rejects unreachable URL %s', (url) => {
    expect(isPubliclyReachable(url)).toBe(false);
  });

  it('accepts 172.32.x.x, which is outside the private range', () => {
    expect(isPubliclyReachable('https://172.32.0.1/api/v1/x')).toBe(true);
  });
});
