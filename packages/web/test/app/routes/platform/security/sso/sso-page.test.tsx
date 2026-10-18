/**
 * @vitest-environment jsdom
 */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { SsoDomainVerificationStatus } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  toastMock,
  platformApiMock,
  samlSsoApiMock,
  platformState,
  refetchMock,
  flagState,
} = vi.hoisted(() => {
  function initialFlagState(): {
    edition: string;
    thirdPartyProviders: Record<string, boolean>;
  } {
    return { edition: 'ee', thirdPartyProviders: { google: false } };
  }
  const state: { current: Record<string, unknown> } = { current: {} };
  return {
    flagState: initialFlagState(),
    toastMock: { success: vi.fn(), error: vi.fn(), message: vi.fn() },
    platformApiMock: { update: vi.fn() },
    samlSsoApiMock: {
      discover: vi.fn(),
      updateSsoDomain: vi.fn(),
      verifySsoDomain: vi.fn(),
    },
    platformState: state,
    refetchMock: vi.fn(async () => undefined),
  };
});

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    Object.entries(values ?? {}).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, value),
      key,
    ),
}));

vi.mock('sonner', () => ({ toast: toastMock }));

vi.mock('@/lib/api', () => ({
  api: {
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
}));

vi.mock('@/api/platforms-api', () => ({ platformApi: platformApiMock }));

vi.mock('@/features/platform-admin/api/saml-sso-api', () => ({
  samlSsoApi: samlSsoApiMock,
}));

vi.mock('@/hooks/platform-hooks', () => ({
  platformHooks: {
    useCurrentPlatform: () => ({
      platform: platformState.current,
      refetch: refetchMock,
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    queryKey: ['flags'],
    useFlag: (id: string) => ({
      data:
        id === 'EDITION'
          ? flagState.edition
          : id === 'THIRD_PARTY_AUTH_PROVIDERS_TO_SHOW_MAP'
          ? flagState.thirdPartyProviders
          : 'https://cloud.test/acs',
    }),
  },
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
    <>{children}</>
  ),
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({
    children,
    onSelect,
    disabled,
  }: React.PropsWithChildren<{
    onSelect?: (event: { preventDefault: () => void }) => void;
    disabled?: boolean;
    variant?: string;
  }>) => (
    <div
      role="menuitem"
      aria-disabled={disabled}
      onClick={() => onSelect?.({ preventDefault: () => undefined })}
    >
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/dialog', async () => {
  const { createContext, useContext } = await import('react');
  const DialogContext = createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>({ open: false, onOpenChange: () => undefined });
  return {
    Dialog: ({
      children,
      open,
      onOpenChange,
    }: React.PropsWithChildren<{
      open: boolean;
      onOpenChange: (open: boolean) => void;
    }>) => (
      <DialogContext.Provider value={{ open, onOpenChange }}>
        {children}
      </DialogContext.Provider>
    ),
    DialogTrigger: ({ children }: React.PropsWithChildren) => {
      const { onOpenChange } = useContext(DialogContext);
      return <span onClick={() => onOpenChange(true)}>{children}</span>;
    },
    DialogContent: ({ children }: React.PropsWithChildren) => {
      const { open } = useContext(DialogContext);
      return open ? <div role="dialog">{children}</div> : null;
    },
    DialogHeader: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogTitle: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogDescription: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
    DialogFooter: ({ children }: React.PropsWithChildren) => (
      <div>{children}</div>
    ),
  };
});

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild: _asChild,
    variant: _variant,
    size: _size,
    loading: _loading,
    ...props
  }: React.ComponentProps<'button'> & {
    asChild?: boolean;
    variant?: string;
    size?: string;
    loading?: boolean;
  }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

import { SSOPage } from '@/app/routes/platform/security/sso';
import { SamlSetupPage } from '@/app/routes/platform/security/sso/saml-setup-page';

const pendingVerification = {
  status: SsoDomainVerificationStatus.PENDING_VERIFICATION,
  record: { type: 'TXT', name: '_activepieces.acme.com', value: 'ap-verify=1' },
  createdAt: '2026-10-14T00:00:00.000Z',
};

const verifiedVerification = {
  ...pendingVerification,
  status: SsoDomainVerificationStatus.VERIFIED,
};

const samlConfig = { idpMetadata: '<xml />', idpCertificate: 'cert' };

describe('SSOPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformApiMock.update.mockResolvedValue(undefined);
    samlSsoApiMock.updateSsoDomain.mockResolvedValue({
      ssoDomain: null,
      ssoDomainVerification: null,
    });
    setPlatform({});
    flagState.edition = 'ee';
    flagState.thirdPartyProviders = { google: false };
  });

  it('shows the empty states when nothing is set up', () => {
    mount();

    expect(screen.getByText('Authentication')).toBeDefined();
    expect(screen.getByText('No domain verified')).toBeDefined();
    expect(screen.getByText('No allowed domains')).toBeDefined();
    expect(findButton('Set up')).toBeDefined();
    expect(screen.queryByText('Connected')).toBeNull();
  });

  it('starts verifying a domain from its own dialog, not the SAML walkthrough', async () => {
    mount();

    click(findButton('Verify domain'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Verify a domain')).toBeDefined();
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: ' Acme.com ' },
    });
    await waitFor(() =>
      expect(findButton('Continue', dialog)?.disabled).toBe(false),
    );
    click(findButton('Continue', dialog));

    await waitFor(() =>
      expect(samlSsoApiMock.updateSsoDomain).toHaveBeenCalledWith('acme.com'),
    );
  });

  it('shows a domain being verified and continues verifying from its menu', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    samlSsoApiMock.verifySsoDomain.mockResolvedValue({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    mount();

    expect(screen.getByText('acme.com')).toBeDefined();
    expect(screen.getByText('Verifying')).toBeDefined();
    click(menuItem('Continue verifying'));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Verify acme.com')).toBeDefined();
    expect(within(dialog).getByText('Verify later')).toBeDefined();
    click(findButton('Verify DNS', dialog));

    await waitFor(() =>
      expect(samlSsoApiMock.verifySsoDomain).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(toastMock.message).toHaveBeenCalledWith(
        'TXT record not found yet — DNS can take a few minutes.',
      ),
    );
  });

  it('cancels a verification in progress', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    mount();

    click(menuItem('Cancel verification'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Cancel verifying acme.com?'),
    ).toBeDefined();
    click(findButton('Cancel verification', dialog));

    await waitFor(() =>
      expect(samlSsoApiMock.updateSsoDomain).toHaveBeenCalledWith(null),
    );
  });

  it('shows a verified domain without the DNS check', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mount();

    expect(screen.getByText('Verified')).toBeDefined();
    expect(screen.queryByText('Check DNS again')).toBeNull();
  });

  it('shows the TXT record from the domain menu', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mount();

    click(menuItem('View DNS record'));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('DNS record for acme.com')).toBeDefined();
    expect(within(dialog).getByDisplayValue('ap-verify=1')).toBeDefined();
  });

  it('removes the domain and turns off single sign-on in one request', async () => {
    setPlatform({
      id: 'platform-1',
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'Remove acme.com and delete your SAML connection?',
      ),
    ).toBeDefined();
    expect(
      within(dialog).getByText(
        'This disables single sign-on and deletes its SAML connection.',
      ),
    ).toBeDefined();
    expect(findButton('Remove domain and disable SAML', dialog)?.disabled).toBe(
      true,
    );
    typeToConfirm(dialog, 'acme.com');
    click(findButton('Remove domain and disable SAML', dialog));

    await waitFor(() =>
      expect(samlSsoApiMock.updateSsoDomain).toHaveBeenCalledWith(null),
    );
    expect(samlSsoApiMock.updateSsoDomain).toHaveBeenCalledTimes(1);
    expect(platformApiMock.update).not.toHaveBeenCalled();
  });

  it('warns that no other sign-in method is on before removing a domain with SAML connected', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
    });
    mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).getByText(
        "You can't do this while single sign-on is the only way to sign in. Turn on email or Google sign-in first.",
      ),
    ).toBeDefined();
  });

  it('blocks removing the domain when SAML is the only working sign-in method', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
    });
    mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByLabelText('Type acme.com to confirm'),
    ).toBeNull();
    expect(findButton('Remove domain and disable SAML', dialog)?.disabled).toBe(
      true,
    );
  });

  it('does not warn about other sign-in methods while Google sign-in is on', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
      googleAuthEnabled: true,
    });
    flagState.thirdPartyProviders = { google: true };
    mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).queryByText(
        "You can't do this while single sign-on is the only way to sign in. Turn on email or Google sign-in first.",
      ),
    ).toBeNull();
  });

  it('still warns when the Google switch is on but Google sign-in is not set up', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
      googleAuthEnabled: true,
    });
    mount();

    click(menuItem('Remove domain'));

    expect(
      within(screen.getByRole('dialog')).getByText(
        "You can't do this while single sign-on is the only way to sign in. Turn on email or Google sign-in first.",
      ),
    ).toBeDefined();
  });

  it('drops the add-your-company-domain hint once the company domain is listed', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      allowedAuthDomains: ['acme.com', 'contractors.io'],
    });
    mount();

    expect(
      screen.queryByText(
        "Add your company domain too, or people at your company can't join or sign in with email and password.",
      ),
    ).toBeNull();
  });

  it('shows the server error when removing the domain fails', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    samlSsoApiMock.updateSsoDomain.mockRejectedValue(
      new Error('Request failed'),
    );
    mount();

    click(menuItem('Remove domain'));
    typeToConfirm(screen.getByRole('dialog'), 'acme.com');
    click(
      findButton('Remove domain and disable SAML', screen.getByRole('dialog')),
    );

    await waitFor(() =>
      expect(toastMock.error).toHaveBeenCalledWith('Request failed'),
    );
  });

  it('removes a domain that has no SAML connection', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        "To set up single sign-on later, you'll need to verify the domain again with a new DNS record.",
      ),
    ).toBeDefined();
    typeToConfirm(dialog, 'acme.com');
    click(findButton('Remove domain', dialog));

    await waitFor(() =>
      expect(samlSsoApiMock.updateSsoDomain).toHaveBeenCalledWith(null),
    );
    expect(platformApiMock.update).not.toHaveBeenCalled();
  });

  it('shows a connected SAML provider as Manage', () => {
    setPlatform({ federatedAuthProviders: { saml: samlConfig } });
    mount();

    expect(screen.getByText('Connected')).toBeDefined();
    expect(findButton('Manage')).toBeDefined();
  });

  it('asks before turning Google off and email on, then sends the same requests as before', async () => {
    setPlatform({
      id: 'platform-1',
      googleAuthEnabled: true,
      emailAuthEnabled: false,
    });
    mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    expect(platformApiMock.update).not.toHaveBeenCalled();
    let dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Turn off Google sign-in?')).toBeDefined();
    click(findButton('Turn off', dialog));
    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { googleAuthEnabled: false },
        'platform-1',
      ),
    );

    click(screen.getByRole('switch', { name: 'Email and password' }));
    dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Turn on email sign-in?')).toBeDefined();
    click(findButton('Turn on', dialog));
    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { emailAuthEnabled: true },
        'platform-1',
      ),
    );
  });

  it('refreshes the flags after changing Google so the sign-in checks use the new state', async () => {
    const invalidate = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    setPlatform({ id: 'platform-1' });
    mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    click(findButton('Turn on', screen.getByRole('dialog')));

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['flags'] }),
    );
    invalidate.mockRestore();
  });

  it('says Google is not set up on a self-hosted server without Google credentials', () => {
    setPlatform({ googleAuthEnabled: true });
    mount();

    expect(screen.getByText('Not set up')).toBeDefined();
    expect(
      screen.getByText('Needs a Google OAuth client on this server.'),
    ).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'Setup guide' }).getAttribute('href'),
    ).toBe('https://www.activepieces.com/docs/admin-guide/guides/sso#google');
  });

  it('shows no Google note once Google sign-in works', () => {
    setPlatform({ googleAuthEnabled: true });
    flagState.thirdPartyProviders = { google: true };
    mount();

    expect(screen.queryByText('Not set up')).toBeNull();
  });

  it('never shows the Google note on Cloud', () => {
    flagState.edition = 'cloud';
    setPlatform({ googleAuthEnabled: true });
    mount();

    expect(screen.queryByText('Not set up')).toBeNull();
  });

  it('says what self-hosted needs when turning Google on', () => {
    mount();
    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    expect(
      within(screen.getByRole('dialog')).getByText(
        'On a self-hosted server it also needs a Google OAuth client.',
        { exact: false },
      ),
    ).toBeDefined();
  });

  it('does not mention self-hosted setup when turning Google on in Cloud', () => {
    flagState.edition = 'cloud';
    mount();
    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    expect(
      within(screen.getByRole('dialog')).queryByText(
        'On a self-hosted server it also needs a Google OAuth client.',
        { exact: false },
      ),
    ).toBeNull();
  });

  it('blocks turning email off when it is the last working sign-in method', () => {
    setPlatform({ emailAuthEnabled: true, googleAuthEnabled: true });
    mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeDefined();
    expect(findButton('Turn off', dialog)?.disabled).toBe(true);
  });

  it('lets email be turned off when single sign-on is connected', () => {
    setPlatform({
      emailAuthEnabled: true,
      federatedAuthProviders: { saml: samlConfig },
    });
    mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeNull();
    expect(findButton('Turn off', dialog)?.disabled).toBe(false);
  });

  it('lets email be turned off when Google sign-in works', () => {
    setPlatform({ emailAuthEnabled: true, googleAuthEnabled: true });
    flagState.thirdPartyProviders = { google: true };
    mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));

    expect(findButton('Turn off', screen.getByRole('dialog'))?.disabled).toBe(
      false,
    );
  });

  it('blocks turning Google off when it works and is the last sign-in method', () => {
    setPlatform({ emailAuthEnabled: false, googleAuthEnabled: true });
    flagState.thirdPartyProviders = { google: true };
    mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeDefined();
    expect(findButton('Turn off', dialog)?.disabled).toBe(true);
  });

  it('lets Google be turned off when it does not actually work', () => {
    setPlatform({ emailAuthEnabled: false, googleAuthEnabled: true });
    mount();

    click(screen.getByRole('switch', { name: 'Continue with Google' }));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeNull();
    expect(findButton('Turn off', dialog)?.disabled).toBe(false);
  });

  it('does not count single sign-on as working on Cloud without a verified domain', () => {
    flagState.edition = 'cloud';
    setPlatform({
      emailAuthEnabled: true,
      federatedAuthProviders: { saml: samlConfig },
    });
    mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));

    expect(
      within(screen.getByRole('dialog')).getByText(
        "You can't turn this off while it's the only way to sign in. Turn on another sign-in method first.",
      ),
    ).toBeDefined();
  });

  it('shows no Google note while the edition is still loading', () => {
    flagState.edition = '';
    setPlatform({ googleAuthEnabled: true });
    mount();

    expect(screen.queryByText('Not set up')).toBeNull();
  });

  it('changes nothing when a method change is cancelled', () => {
    setPlatform({ emailAuthEnabled: true });
    mount();

    click(screen.getByRole('switch', { name: 'Email and password' }));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'People can no longer sign in with email and password.',
      ),
    ).toBeDefined();
    click(findButton('Cancel', dialog));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(platformApiMock.update).not.toHaveBeenCalled();
  });

  it('says on self-hosted that allowed domains also limit who can join', () => {
    mount();

    expect(
      screen.getByText(
        'Limit who can join, and who can sign in with email and password, to the domains you add.',
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        'Anyone can join or sign in with email and password until you add a domain.',
      ),
    ).toBeDefined();
  });

  it('says on Cloud that allowed domains limit email and password sign-in only', () => {
    flagState.edition = 'cloud';
    setPlatform({ allowedAuthDomains: ['contractors.io', 'partners.io'] });
    mount();

    expect(
      screen.getByText(
        'Limit email and password sign-in to the domains you add.',
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Add your company domain too, or people at your company can't sign in with email and password.",
      ),
    ).toBeDefined();
    expect(screen.queryByText(/join/)).toBeNull();

    click(menuItem('Remove domain'));
    expect(
      within(screen.getByRole('dialog')).getByText(
        'People at contractors.io can no longer sign in with email and password.',
      ),
    ).toBeDefined();
  });

  it('describes adding the first allowed domain on Cloud without mentioning joining', () => {
    flagState.edition = 'cloud';
    mount();

    click(findButton('Add domain'));
    expect(
      within(screen.getByRole('dialog')).getByText(
        'Once a domain is on this list, only people at listed domains can sign in with email and password. Add your company domain too.',
      ),
    ).toBeDefined();
  });

  it('removes one allowed domain and keeps the list enforced', async () => {
    setPlatform({
      id: 'platform-1',
      allowedAuthDomains: ['contractors.io', 'partners.io'],
    });
    mount();

    expect(screen.getByText('contractors.io')).toBeDefined();
    click(menuItem('Remove domain'));
    click(findButton('Remove domain', screen.getByRole('dialog')));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        {
          allowedAuthDomains: ['partners.io'],
          enforceAllowedAuthDomains: true,
        },
        'platform-1',
      ),
    );
  });

  it('stops enforcing the list when the last allowed domain is removed', async () => {
    setPlatform({ id: 'platform-1', allowedAuthDomains: ['contractors.io'] });
    mount();

    click(menuItem('Remove domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'With no domains left, anyone can join or sign in with email and password.',
      ),
    ).toBeDefined();
    click(findButton('Remove domain', dialog));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { allowedAuthDomains: [], enforceAllowedAuthDomains: false },
        'platform-1',
      ),
    );
  });

  it('adds the first allowed domain in one step and warns to add your company domain', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mount();

    click(findButton('Add domain'));
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText(
        'Once a domain is on this list, only people at listed domains can join or sign in with email and password. Add your company domain too.',
      ),
    ).toBeDefined();
    fireEvent.change(within(dialog).getByLabelText('Domain'), {
      target: { value: ' Contractors.IO ' },
    });
    await submitWhenValid(dialog);

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        {
          allowedAuthDomains: ['contractors.io'],
          enforceAllowedAuthDomains: true,
        },
        'platform-1',
      ),
    );
  });

  it('appends a allowed domain to the existing list', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      allowedAuthDomains: ['contractors.io'],
    });
    mount();

    click(findButton('Add domain'));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'partners.io' },
    });
    await submitWhenValid(dialog);

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        {
          allowedAuthDomains: ['contractors.io', 'partners.io'],
          enforceAllowedAuthDomains: true,
        },
        'platform-1',
      ),
    );
  });

  it('refuses a allowed domain that is already on the list', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      allowedAuthDomains: ['contractors.io'],
    });
    mount();

    click(findButton('Add domain'));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'contractors.io' },
    });

    expect(await within(dialog).findByText('duplicateDomain')).toBeDefined();
    expect(findButton('Add domain', dialog)?.disabled).toBe(true);
  });
});

describe('SamlSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformApiMock.update.mockResolvedValue(undefined);
    setPlatform({});
    flagState.edition = 'ee';
    flagState.thirdPartyProviders = { google: false };
  });

  it('is opened from the sign-in methods row as a page, not a dialog', () => {
    mount();

    expect(
      screen.getByRole('link', { name: 'Set up' }).getAttribute('href'),
    ).toBe('/platform/sso/saml');
  });

  it('saves the SAML connection with the same request as before and returns to Authentication', async () => {
    setPlatform({
      id: 'platform-1',
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mountSetupPage();

    fireEvent.change(screen.getByLabelText('IDP Metadata'), {
      target: { value: '<xml />' },
    });
    fireEvent.change(screen.getByLabelText('IDP Certificate'), {
      target: { value: 'cert' },
    });
    await waitFor(() => expect(findButton('Save')?.disabled).toBe(false));
    click(findButton('Save'));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        {
          federatedAuthProviders: {
            saml: { idpMetadata: '<xml />', idpCertificate: 'cert' },
          },
        },
        'platform-1',
      ),
    );
    expect(await screen.findByText('authentication page')).toBeDefined();
  });

  it('shows the server error when saving the SAML connection fails', async () => {
    platformApiMock.update.mockRejectedValue(
      new Error('SSO domain must be verified before configuring SAML'),
    );
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mountSetupPage();

    fireEvent.change(screen.getByLabelText('IDP Metadata'), {
      target: { value: '<xml />' },
    });
    fireEvent.change(screen.getByLabelText('IDP Certificate'), {
      target: { value: 'cert' },
    });
    await waitFor(() => expect(findButton('Save')?.disabled).toBe(false));
    click(findButton('Save'));

    expect(
      await screen.findByText(
        'SSO domain must be verified before configuring SAML',
      ),
    ).toBeDefined();
  });

  it('offers Disable on the SAML step only, and disables after confirming', async () => {
    setPlatform({
      id: 'platform-1',
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    mountSetupPage();

    expect(
      screen
        .getByRole('button', { name: '2 SAML 2.0' })
        .getAttribute('aria-current'),
    ).toBe('step');
    expect(screen.getByText('Disable single sign-on')).toBeDefined();
    click(findButton('1SSO Domain'));
    expect(screen.queryByText('Disable single sign-on')).toBeNull();
    click(findButton('2SAML 2.0'));
    click(findButton('Disable'));
    expect(platformApiMock.update).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Disable single sign-on?')).toBeDefined();
    expect(findButton('Disable', dialog)?.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText('Type disable to confirm'), {
      target: { value: 'Disable' },
    });
    expect(findButton('Disable', dialog)?.disabled).toBe(true);
    fireEvent.change(within(dialog).getByLabelText('Type disable to confirm'), {
      target: { value: 'disable' },
    });
    click(findButton('Disable', dialog));

    await waitFor(() =>
      expect(platformApiMock.update).toHaveBeenCalledWith(
        { federatedAuthProviders: { saml: null } },
        'platform-1',
      ),
    );
    expect(await screen.findByText('authentication page')).toBeDefined();
  });

  it('clears the typed confirmation when the Disable dialog is cancelled', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    mountSetupPage();

    click(findButton('Disable'));
    typeToConfirm(screen.getByRole('dialog'), 'disable');
    click(findButton('Cancel', screen.getByRole('dialog')));
    click(findButton('Disable'));

    expect(findButton('Disable', screen.getByRole('dialog'))?.disabled).toBe(
      true,
    );
  });

  it('blocks disabling single sign-on when it is the only working sign-in method', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
      emailAuthEnabled: false,
    });
    mountSetupPage();

    click(findButton('Disable'));
    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).queryByLabelText('Type disable to confirm'),
    ).toBeNull();
    expect(findButton('Disable', dialog)?.disabled).toBe(true);
  });
  it('shows no Disable when SAML is not connected', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mountSetupPage();

    expect(findButton('Disable')).toBeUndefined();
    expect(screen.queryByText('Disable single sign-on')).toBeNull();
  });

  it('shows the domain read-only on the first step', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    mountSetupPage();

    expect(screen.getByText('acme.com')).toBeDefined();
    expect(screen.queryByDisplayValue('acme.com')).toBeNull();
    expect(findButton('Next')).toBeDefined();
  });

  it('names the domain being verified in the walkthrough', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    mountSetupPage();

    expect(screen.getByText('Verify acme.com')).toBeDefined();
    expect(screen.getByDisplayValue('_activepieces.acme.com')).toBeDefined();
  });

  it('verifies a domain inside the walkthrough when there is none yet', async () => {
    mountSetupPage();

    fireEvent.change(screen.getByLabelText('Domain'), {
      target: { value: 'acme.com' },
    });
    await waitFor(() => expect(findButton('Continue')?.disabled).toBe(false));
    click(findButton('Continue'));

    await waitFor(() =>
      expect(samlSsoApiMock.updateSsoDomain).toHaveBeenCalledWith('acme.com'),
    );
  });

  it('keeps the SAML step locked until the domain is verified', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
    });
    mountSetupPage();

    expect(findButton('Next')?.disabled).toBe(true);
    expect(findButton('Verify DNS')?.disabled).toBe(false);
    expect(findButton('2SAML 2.0')?.disabled).toBe(true);
  });

  it('opens the SAML step while the domain is pending when SAML is already connected', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: pendingVerification,
      federatedAuthProviders: { saml: {} },
    });
    mountSetupPage();

    expect(findButton('2SAML 2.0')?.disabled).toBe(false);
    click(findButton('Next'));
    expect(
      screen
        .getByRole('button', { name: '2 SAML 2.0' })
        .getAttribute('aria-current'),
    ).toBe('step');
    expect(findButton('Save')?.disabled).toBe(true);
  });

  it('moves between steps from the step labels', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mountSetupPage();

    click(findButton('1SSO Domain'));
    expect(
      screen
        .getByRole('button', { name: '1 SSO Domain' })
        .getAttribute('aria-current'),
    ).toBe('step');
    click(findButton('2SAML 2.0'));
    expect(
      screen
        .getByRole('button', { name: '2 SAML 2.0' })
        .getAttribute('aria-current'),
    ).toBe('step');
  });

  it('shows the values to copy into the identity provider', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mountSetupPage();

    expect(screen.getByDisplayValue('https://cloud.test/acs')).toBeDefined();
    expect(screen.getByDisplayValue('Activepieces')).toBeDefined();
  });

  it('says a cleared SAML field is required', async () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
    });
    mountSetupPage();

    const metadata = screen.getByLabelText('IDP Metadata');
    fireEvent.change(metadata, { target: { value: 'x' } });
    fireEvent.change(metadata, { target: { value: '' } });

    const error = await screen.findByText('required');
    await waitFor(() =>
      expect(metadata.getAttribute('aria-invalid')).toBe('true'),
    );
    expect(metadata.getAttribute('aria-describedby')).toContain(error.id);
  });

  it('says the SAML values are saved instead of looking empty', () => {
    setPlatform({
      ssoDomain: 'acme.com',
      ssoDomainVerification: verifiedVerification,
      federatedAuthProviders: { saml: samlConfig },
    });
    mountSetupPage();

    expect(
      screen.getByText('To change the connection, paste both values again.'),
    ).toBeDefined();

    expect(
      screen.getByLabelText('IDP Metadata').getAttribute('placeholder'),
    ).toBe('Saved. Paste new metadata to replace it.');
    expect(
      screen.getByLabelText('IDP Certificate').getAttribute('placeholder'),
    ).toBe('Saved. Paste a new certificate to replace it.');
  });
});

async function submitWhenValid(dialog: HTMLElement) {
  await waitFor(() =>
    expect(findButton('Add domain', dialog)?.disabled).toBe(false),
  );
  click(findButton('Add domain', dialog));
}

function typeToConfirm(dialog: HTMLElement, text: string) {
  fireEvent.change(within(dialog).getByLabelText(`Type ${text} to confirm`), {
    target: { value: text },
  });
}

function setPlatform(overrides: Record<string, unknown>) {
  platformState.current = {
    id: 'platform-1',
    ssoDomain: null,
    ssoDomainVerification: null,
    federatedAuthProviders: {},
    googleAuthEnabled: false,
    emailAuthEnabled: true,
    allowedAuthDomains: [],
    ...overrides,
  };
}

function mount() {
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient()}>
        <SSOPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function mountSetupPage() {
  render(
    <MemoryRouter initialEntries={['/platform/sso/saml']}>
      <QueryClientProvider client={new QueryClient()}>
        <Routes>
          <Route
            path="/platform/sso"
            element={<div>authentication page</div>}
          />
          <Route path="/platform/sso/saml" element={<SamlSetupPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function click(element: Element | null | undefined) {
  if (!element) {
    throw new Error('element not found');
  }
  fireEvent.click(element);
}

function menuItem(text: string) {
  return screen
    .getAllByRole('menuitem')
    .find((item) => item.textContent === text);
}

function findButton(text: string, scope: ParentNode = document.body) {
  return Array.from(scope.querySelectorAll('button')).find(
    (button) => button.textContent === text,
  );
}
