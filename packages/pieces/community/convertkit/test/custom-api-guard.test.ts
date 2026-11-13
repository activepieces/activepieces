/// <reference types="vitest/globals" />

import { assertKitUrl } from '../src/lib/common/custom-api-guard';

const check = (url: string) => () => assertKitUrl({ url: { url } });

describe('Custom API Call host guard', () => {
  test.each([
    '/account',
    'account',
    '/subscribers?page=2',
    'https://api.convertkit.com/v3/account',
    'https://api.convertkit.com/v3',
  ])('allows %s', (url) => {
    expect(check(url)).not.toThrow();
  });

  test.each([
    'https://example.com/steal',
    'https://api.convertkit.com.evil.io/v3/account',
    'https://api.convertkit.com@evil.io/v3/account',
    'https://user:pass@api.convertkit.com/v3/account',
    'http://api.convertkit.com/v3/account',
    'https://api.convertkit.com/v4/account',
    'https://api.convertkit.com/v3/../v4/account',
    '/../account',
    '%2e%2e/account',
    '//evil.io/account',
    '\\\\evil.io\\account',
  ])('refuses %s', (url) => {
    expect(check(url)).toThrow('only sends your Kit API Secret');
  });
});
