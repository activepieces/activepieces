import { describe, expect, it } from 'vitest';
import { dynamicsHostUrl } from '../src/lib/common/host-url';

describe('dynamicsHostUrl', () => {
  it('normalizes the three input variants to one URL', () => {
    const variants = ['orgx.crm17.dynamics.com', 'https://orgx.crm17.dynamics.com', 'https://orgx.crm17.dynamics.com/'];
    const results = variants.map((hostUrl) => dynamicsHostUrl.getApiBaseUrl({ hostUrl }));
    expect(new Set(results)).toEqual(new Set(['https://orgx.crm17.dynamics.com/api/data/v9.2']));
  });

  it('strips a pasted Web API suffix and surrounding spaces', () => {
    expect(dynamicsHostUrl.normalizeHostUrl('  https://orgx.crm.dynamics.com/api/data/v9.2/ ')).toBe('https://orgx.crm.dynamics.com');
  });

  it('rejects http and credentials', () => {
    expect(() => dynamicsHostUrl.normalizeHostUrl('http://orgx.crm.dynamics.com')).toThrow(/https/);
    expect(() => dynamicsHostUrl.normalizeHostUrl('https://u:p@orgx.crm.dynamics.com')).toThrow(/user name/);
    expect(() => dynamicsHostUrl.normalizeHostUrl('')).toThrow(/empty/);
  });

  it('uses the proxy when set, without a trailing slash', () => {
    expect(dynamicsHostUrl.getApiBaseUrl({ hostUrl: 'orgx.crm.dynamics.com', proxyUrl: 'http://proxy.local:8080/' })).toBe('http://proxy.local:8080/api/data/v9.2');
    expect(dynamicsHostUrl.getApiBaseUrl({ hostUrl: 'orgx.crm.dynamics.com', proxyUrl: '' })).toBe('https://orgx.crm.dynamics.com/api/data/v9.2');
  });
});
