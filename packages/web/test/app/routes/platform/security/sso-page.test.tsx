/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  platform: {
    id: 'p',
    googleAuthEnabled: false,
    emailAuthEnabled: true,
    federatedAuthProviders: {},
    ssoDomainVerification: null,
    allowedAuthDomains: [],
    ssoDomain: null,
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: undefined }) },
}));
vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: state.platform,
      refetch: () => Promise.resolve(),
    }),
  },
}));
vi.mock('@/api/platforms-api', () => ({ platformApi: { update: vi.fn() } }));
vi.mock('@/app/routes/platform/security/sso/allowed-domain', () => ({
  AllowedDomainDialog: () => null,
}));
vi.mock('@/app/routes/platform/security/sso/saml-dialog', () => ({
  ConfigureSamlDialog: () => null,
}));

import { SSOPage } from '@/app/routes/platform/security/sso';

const HINT =
  'Allow logins through email and password. Turn on Google or SAML before turning this off, so people can still sign in.';

function renderPage() {
  return render(
    <MemoryRouter>
      <SSOPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  state.platform = { ...state.platform, googleAuthEnabled: false };
});

describe('SSOPage email sign-in', () => {
  it('cannot be turned off while it is the only sign-in method', () => {
    renderPage();
    const toggle = screen.getByRole('switch', { name: 'Allowed Email Login' });
    expect(toggle.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText(HINT)).toBeTruthy();
  });

  it('can be turned off once Google sign-in is on', () => {
    state.platform = { ...state.platform, googleAuthEnabled: true };
    renderPage();
    const toggle = screen.getByRole('switch', { name: 'Allowed Email Login' });
    expect(toggle.hasAttribute('disabled')).toBe(false);
    expect(screen.queryByText(HINT)).toBeNull();
  });
});
