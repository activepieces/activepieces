/**
 * @vitest-environment jsdom
 */
import {
  PlatformWithoutSensitiveData,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

import { ssoRules } from '@/app/routes/platform/security/sso/sso-rules';

const state = vi.hoisted(() => ({
  platform: {} as Record<string, unknown>,
  flags: {} as Record<string, unknown>,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/api/flags-api', () => ({
  flagsApi: { getAll: () => Promise.resolve(state.flags) },
}));
vi.mock('@/api/platforms-api', () => ({
  platformApi: {
    getCurrentPlatform: () =>
      Promise.resolve(state.platform as PlatformWithoutSensitiveData),
  },
}));

const SAML = { federatedAuthProviders: { saml: {} } };
const VERIFIED_SAML = {
  ...SAML,
  ssoDomain: 'acme.com',
  ssoDomainVerification: { status: SsoDomainVerificationStatus.VERIFIED },
};
const EMAIL = { emailAuthEnabled: true };
const GOOGLE = { googleAuthEnabled: true };
const BOTH = { ...EMAIL, ...GOOGLE };
const NO_EMAIL = { emailAuthEnabled: false };
const NO_GOOGLE = { googleAuthEnabled: false };
const NO_SAML = { samlConnected: false };
const NEW_DOMAIN = { domainChanges: true };
const EMAIL_SAML = { ...EMAIL, ...SAML };

describe('ssoRules.assertSignInRemains', () => {
  it.each([
    ['email only, email off', 'ee', EMAIL, true, NO_EMAIL, true],
    ['email + Google, email off', 'ee', BOTH, true, NO_EMAIL, false],
    ['Google has no credentials', 'ee', BOTH, false, NO_EMAIL, true],
    ['other admin turned email off', 'ee', GOOGLE, true, NO_GOOGLE, true],
    ['Cloud SAML, new domain', 'cloud', VERIFIED_SAML, true, NEW_DOMAIN, true],
    ['EE SAML, new domain', 'ee', VERIFIED_SAML, true, NEW_DOMAIN, false],
    ['EE SAML before domains', 'ee', EMAIL_SAML, true, NO_EMAIL, false],
    ['Cloud SAML, no domain', 'cloud', EMAIL_SAML, true, NO_EMAIL, true],
  ])('%s', async (_, edition, server, googleConfigured, change, locksOut) => {
    state.platform = {
      emailAuthEnabled: false,
      googleAuthEnabled: false,
      ...server,
    };
    state.flags = {
      EDITION: edition,
      THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP: { google: googleConfigured },
    };
    const result = ssoRules.assertSignInRemains(change);
    if (locksOut) {
      await expect(result).rejects.toThrow(
        'This would leave no way to sign in',
      );
    } else {
      await expect(result).resolves.toBeUndefined();
    }
  });
});

describe('ssoRules.change', () => {
  it('runs overlapping sign-in changes one at a time', async () => {
    state.platform = { emailAuthEnabled: false, ...GOOGLE, ...VERIFIED_SAML };
    state.flags = { THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP: { google: true } };
    const write = (patch: Record<string, unknown>) => async () => {
      state.platform = { ...state.platform, ...patch };
    };
    const googleOff = ssoRules.change({
      check: NO_GOOGLE,
      write: write(NO_GOOGLE),
    });
    const samlOff = ssoRules.change({
      check: NO_SAML,
      write: write({ federatedAuthProviders: null }),
    });
    await googleOff;
    await expect(samlOff).rejects.toThrow('This would leave no way to sign in');
  });
});
