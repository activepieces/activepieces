/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import { AppConnectionType } from '@activepieces/shared';

import { OAuth2App, oauth2Utils } from '@/features/connections';

const PENDING = 'pending';

const DECODING_PAGE: RedirectPageFixture = {
  name: 'redirect.tsx, which decodes once via URLSearchParams',
  origin: 'http://localhost',
  redirectUrl: 'http://localhost/redirect',
  oauth2Type: AppConnectionType.PLATFORM_OAUTH2,
  post: (issuedCode) => {
    const posted = new URLSearchParams(
      `?code=${encodeURIComponent(issuedCode)}`,
    ).get('code');
    if (posted === null) {
      throw new Error('code param missing');
    }
    return posted;
  },
};

const RAW_PAGE: RedirectPageFixture = {
  name: 'secrets.activepieces.com, which posts the raw query value (verified 2026-09-08)',
  origin: 'https://secrets.activepieces.com',
  redirectUrl: 'https://secrets.activepieces.com/redirect',
  oauth2Type: AppConnectionType.CLOUD_OAUTH2,
  post: (issuedCode) => encodeURIComponent(issuedCode),
};

function dispatchCodeMessage({ code, origin }: DispatchParams): void {
  window.dispatchEvent(
    new MessageEvent('message', { data: { code }, origin }),
  );
}

function openPopupAwaitingCode(page: RedirectPageFixture): Promise<string> {
  return oauth2Utils
    .openOAuth2Popup({
      authorizationUrl: 'https://provider.example/authorize',
      redirectUrl: page.redirectUrl,
      oauth2Type: page.oauth2Type,
    })
    .then((response) => response.code);
}

function settleOrPending(pending: Promise<string>): Promise<string> {
  return Promise.race([
    pending,
    new Promise<string>((resolve) => setTimeout(() => resolve(PENDING), 50)),
  ]);
}

async function codeReachingTokenExchange({
  issuedCode,
  page,
}: CodeReachingTokenExchangeParams): Promise<string> {
  const pending = openPopupAwaitingCode(page);
  dispatchCodeMessage({ code: page.post(issuedCode), origin: page.origin });
  return settleOrPending(pending);
}

describe.each([DECODING_PAGE, RAW_PAGE])(
  'authorization code posted by $name',
  (page) => {
    it.each([
      ['a percent-encoded sequence', 'k1%2Fk2'],
      ['an invalid percent escape', 'abc%zzdef'],
      ['base64 padding and separators', '4/0AVMBsJj+xyz='],
      ['nothing that needs encoding', 'plainSafeCode-123_456.789'],
    ])('reaches the token exchange unchanged with %s', async (_, issuedCode) => {
      expect(await codeReachingTokenExchange({ issuedCode, page })).toBe(
        issuedCode,
      );
    });
  },
);

describe('resolveRedirectUrl', () => {
  const platformRedirectUrl = 'https://self-hosted.example/redirect';
  const selfHostedTypes: OAuth2App['oauth2Type'][] = [
    AppConnectionType.PLATFORM_OAUTH2,
    AppConnectionType.OAUTH2,
  ];

  it('sends managed apps to the secrets page, which posts a percent-encoded code', () => {
    expect(
      oauth2Utils.resolveRedirectUrl({
        oauth2Type: AppConnectionType.CLOUD_OAUTH2,
        platformRedirectUrl,
      }),
    ).toBe('https://secrets.activepieces.com/redirect');
  });

  it.each(selfHostedTypes)(
    'sends %s to the platform redirect page, which posts an already-decoded code',
    (oauth2Type) => {
      expect(
        oauth2Utils.resolveRedirectUrl({ oauth2Type, platformRedirectUrl }),
      ).toBe(platformRedirectUrl);
    },
  );
});

describe('authorization code edge cases', () => {
  it('falls back to the raw value when a raw-posting page sends an undecodable code', async () => {
    const pending = openPopupAwaitingCode(RAW_PAGE);
    dispatchCodeMessage({ code: 'abc%zzdef', origin: RAW_PAGE.origin });

    expect(await settleOrPending(pending)).toBe('abc%zzdef');
  });

  it('ignores a message whose origin is only a prefix of the redirect origin', async () => {
    const pending = openPopupAwaitingCode(RAW_PAGE);
    dispatchCodeMessage({
      code: 'attacker-code',
      origin: 'https://secrets.activepieces.co',
    });

    expect(await settleOrPending(pending)).toBe(PENDING);

    dispatchCodeMessage({ code: 'real-code', origin: RAW_PAGE.origin });
    expect(await settleOrPending(pending)).toBe('real-code');
  });

  it('ignores a message from an unrelated origin', async () => {
    const pending = openPopupAwaitingCode(DECODING_PAGE);
    dispatchCodeMessage({ code: 'attacker-code', origin: 'https://evil.test' });

    expect(await settleOrPending(pending)).toBe(PENDING);

    dispatchCodeMessage({ code: 'real-code', origin: DECODING_PAGE.origin });
    expect(await settleOrPending(pending)).toBe('real-code');
  });
});

type RedirectPageFixture = {
  name: string;
  origin: string;
  redirectUrl: string;
  oauth2Type: OAuth2App['oauth2Type'];
  post: (issuedCode: string) => string;
};

type DispatchParams = {
  code: string;
  origin: string;
};

type CodeReachingTokenExchangeParams = {
  issuedCode: string;
  page: RedirectPageFixture;
};
