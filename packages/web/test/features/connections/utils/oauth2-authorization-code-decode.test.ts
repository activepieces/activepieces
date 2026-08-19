/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { oauth2Utils } from '@/features/connections/utils/oauth2-utils';

const REDIRECT_URL = 'http://localhost/redirect';

function codeAsPostedByRedirectPage(issuedCode: string): string {
  const redirectSearch = `?code=${encodeURIComponent(issuedCode)}`;
  const code = new URLSearchParams(redirectSearch).get('code');
  if (code === null) {
    throw new Error('code param missing');
  }
  return code;
}

function dispatchCodeMessage(code: string): void {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { code },
      origin: 'http://localhost',
    }),
  );
}

async function codeReachingTokenExchange(issuedCode: string): Promise<string> {
  const response = oauth2Utils.openOAuth2Popup({
    authorizationUrl: 'https://provider.example/authorize',
    redirectUrl: REDIRECT_URL,
  });
  dispatchCodeMessage(codeAsPostedByRedirectPage(issuedCode));
  const { code } = await response;
  return code;
}

describe('OAuth2 authorization code decode (GIT-1763)', () => {
  it('preserves a code containing a percent-encoded sequence', async () => {
    const issuedCode = 'k1%2Fk2';
    expect(await codeReachingTokenExchange(issuedCode)).toBe(issuedCode);
  });

  it('resolves without hanging when the code contains a stray percent sign', async () => {
    const issuedCode = 'abc%zzdef';

    const outcome = await Promise.race([
      codeReachingTokenExchange(issuedCode),
      new Promise<'still-pending'>((resolve) =>
        setTimeout(() => resolve('still-pending'), 100),
      ),
    ]);

    expect(outcome).toBe(issuedCode);
  });

  it('leaves URL-safe codes unchanged', async () => {
    const issuedCode = 'plainSafeCode-123_456.789';
    expect(await codeReachingTokenExchange(issuedCode)).toBe(issuedCode);
  });
});
