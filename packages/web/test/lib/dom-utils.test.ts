// @vitest-environment jsdom
// `dom-utils` reads `window.opener ?? window.parent` at module load, so this
// suite needs a DOM.
import { describe, expect, it } from 'vitest';

import { isStepFileUrl } from '@/lib/dom-utils';

describe('isStepFileUrl', () => {
  it('detects the unified /api/v1/files/ read URLs (GIT-1618 regression)', () => {
    expect(
      isStepFileUrl(
        'https://cloud.activepieces.com/api/v1/files/abc123?token=eyJhbGci',
      ),
    ).toBe(true);
    expect(isStepFileUrl('/api/v1/files/abc123?token=eyJhbGci')).toBe(true);
  });

  it('still detects the legacy /api/v1/step-files/ URLs', () => {
    expect(
      isStepFileUrl(
        'https://cloud.activepieces.com/api/v1/step-files/signed?token=eyJhbGci',
      ),
    ).toBe(true);
  });

  it('detects file:// sandbox URLs', () => {
    expect(isStepFileUrl('file:///tmp/step-file.pdf')).toBe(true);
  });

  it('returns false for ordinary URLs and text', () => {
    expect(isStepFileUrl('https://example.com/api/v1/files')).toBe(false);
    expect(isStepFileUrl('https://example.com/download/report.pdf')).toBe(
      false,
    );
    expect(isStepFileUrl('just some text')).toBe(false);
  });

  it('does not match a generic third-party /api/v1/files/ URL without a token', () => {
    // A vendor API path can share the generic '/api/v1/files/' shape; without the
    // signed token query param it must not render as a Download File button.
    expect(isStepFileUrl('https://some-vendor.com/api/v1/files/42')).toBe(
      false,
    );
    expect(
      isStepFileUrl('https://some-vendor.com/api/v1/files/42?page=1'),
    ).toBe(false);
  });

  it('does not match third-party file URLs whose auth param merely contains "token="', () => {
    // Pipedrive's own API is `<domain>/api/v1/files/...` and it authenticates
    // with `?api_token=` — which contains the substring "token=". OAuth URLs use
    // `?access_token=`. Neither is the AP signed `?token=` param.
    expect(
      isStepFileUrl('https://acme.pipedrive.com/api/v1/files/99?api_token=abc'),
    ).toBe(false);
    expect(
      isStepFileUrl(
        'https://acme.pipedrive.com/api/v1/files/99/download?api_token=abc',
      ),
    ).toBe(false);
    expect(isStepFileUrl('https://x.com/api/v1/files/1?access_token=zzz')).toBe(
      false,
    );
  });

  it('returns false for non-string and empty values', () => {
    expect(isStepFileUrl('')).toBe(false);
    expect(isStepFileUrl(null)).toBe(false);
    expect(isStepFileUrl(undefined)).toBe(false);
    expect(isStepFileUrl(42)).toBe(false);
    expect(isStepFileUrl({ url: '/api/v1/files/abc' })).toBe(false);
  });
});
